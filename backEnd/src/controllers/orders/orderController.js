import bcryptjs from "bcryptjs";
import Order from "../../models/orders/orderModel.js";
import Invoice from "../../models/orders/invoiceModel.js";
import Combos from "../../models/menu/combosModel.js";
import Drinks from "../../models/menu/drinksModel.js";
import Extras from "../../models/menu/extrasModel.js";
import TablesModel from "../../models/tables/tablesModel.js";
import AdminModel from "../../models/users/adminModel.js";

const orderController = {};

const ONE_HOUR_MS = 60 * 60 * 1000;

// Revisa los pedidos "preparing" y marca como "atrasado" los que llevan más
// de 1 hora sin pasar a "ready". Se ejecuta cada vez que se listan pedidos,
// para no depender de un cron/proceso en segundo plano aparte.
const flagDelayedOrders = async () => {
  const preparingOrders = await Order.find({ status: 'preparing' });
  const cutoff = Date.now() - ONE_HOUR_MS;

  for (const order of preparingOrders) {
    const history = order.statusHistory || [];
    const lastPreparingEntry = [...history].reverse().find((h) => h.status === 'preparing');
    const since = lastPreparingEntry ? new Date(lastPreparingEntry.changedAt).getTime() : new Date(order.updatedAt).getTime();

    if (since <= cutoff) {
      order.status = 'atrasado';
      order.statusHistory.push({ status: 'atrasado', changedAt: new Date() });
      await order.save();
    }
  }
};

// Arma el registro de facturación (colección "invoices") a partir de un
// pedido recién entregado. Se llama una sola vez, cuando el estado pasa a
// "delivered" por primera vez (ver updateOrderStatus).
const generateInvoice = async (order) => {
  await Invoice.create({
    order: order._id,
    orderType: order.orderType,
    items: (order.items || []).map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    total: order.total,
    tableNumber: order.table?.number,
    waiterName: order.waiter
      ? `${order.waiter.name || ''} ${order.waiter.lastname || ''}`.trim()
      : undefined,
    customerName: order.customer?.personalInfo
      ? `${order.customer.personalInfo.name || ''} ${order.customer.personalInfo.lastname || ''}`.trim()
      : undefined,
    isDelivery: order.isDelivery,
    paymentMethod: order.paymentMethod,
  });
};

// Crear pedido. Los campos que se guardan cambian según orderType:
//   - "local": requiere mesa (debe estar "ocupada") y el mesero es quien tiene la sesión.
//   - "online": requiere cliente, y si isDelivery es true, la dirección de entrega.
orderController.createOrder = async (req, res) => {
  try {
    const { orderType, items } = req.body;

    if (!['local', 'online'].includes(orderType)) {
      return res.status(400).json({ message: "orderType debe ser 'local' u 'online'" });
    }

    const orderFields = { orderType };

    if (orderType === 'local') {
      const { table } = req.body;
      const waiter = req.user.id;

      if (!table) return res.status(400).json({ message: "La mesa es obligatoria en pedidos locales" });

      const tableDoc = await TablesModel.findById(table);
      if (!tableDoc) return res.status(404).json({ message: "Mesa no encontrada" });

      // Solo se pueden crear pedidos si la mesa está ocupada
      if (tableDoc.status !== 'ocupada') {
        return res.status(400).json({ message: "Solo se pueden tomar pedidos en mesas ocupadas" });
      }

      orderFields.table = table;
      orderFields.waiter = waiter;
    } else {
      const { customer, isDelivery, deliveryAddress, paymentMethod } = req.body;

      if (!customer) return res.status(400).json({ message: "El cliente es obligatorio en pedidos en línea" });
      if (isDelivery && !deliveryAddress) {
        return res.status(400).json({ message: "La dirección de entrega es obligatoria para pedidos a domicilio" });
      }

      orderFields.customer = customer;
      orderFields.isDelivery = !!isDelivery;
      orderFields.deliveryAddress = isDelivery ? deliveryAddress : undefined;
      orderFields.paymentMethod = paymentMethod || 'cash';
    }

    // Procesar items (igual para ambos tipos: se busca el producto real para
    // congelar su nombre/precio en el pedido)
    let total = 0;
    const processedItems = [];

    for (let item of items) {
      let model;
      switch (item.itemType) {
        case 'combo': model = Combos; break;
        case 'extra': model = Extras; break;
        case 'drink': model = Drinks; break;
        default: return res.status(400).json({ message: `Invalid item type: ${item.itemType}` });
      }

      const product = await model.findById(item.itemId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.itemId}` });

      const quantity = item.quantity || 1;
      const price = product.price;
      total += price * quantity;

      processedItems.push({
        itemType: item.itemType,
        itemId: item.itemId,
        name: product.name,
        price,
        quantity,
        notes: item.notes || ''
      });
    }

    const newOrder = new Order({
      ...orderFields,
      items: processedItems,
      total,
      status: 'pending',
      statusHistory: [{ status: 'pending', changedAt: new Date() }]
    });

    await newOrder.save();

    const populated = await Order.findById(newOrder._id)
      .populate('table', 'number status')
      .populate('waiter', 'name lastname')
      .populate('customer', 'personalInfo');

    return res.status(201).json({ message: "Order created", data: populated });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Obtener pedidos, con filtros opcionales por tipo (?orderType=local|online)
// y estado (?status=). El populate de table/waiter/customer no molesta
// aunque el pedido sea del otro tipo: simplemente queda null.
orderController.getOrders = async (req, res) => {
  try {
    await flagDelayedOrders();

    const filter = {};
    if (req.query.table) filter.table = req.query.table;
    if (req.query.waiter) filter.waiter = req.query.waiter;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.orderType) filter.orderType = req.query.orderType;

    const orders = await Order.find(filter)
      .populate('table', 'number status')
      .populate('waiter', 'name lastname')
      .populate('customer', 'personalInfo loginInfo.email')
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cambiar estado de un pedido. Cuando el nuevo estado es "delivered" (y no
// lo era ya), se dispara la facturación automática (ver generateInvoice).
orderController.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'atrasado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const previousOrder = await Order.findById(req.params.id).select("status");
    if (!previousOrder) return res.status(404).json({ message: "Order not found" });

    const mongoUpdate = { $set: { status } };
    if (previousOrder.status !== status) {
      mongoUpdate.$push = { statusHistory: { status, changedAt: new Date() } };
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      { new: true }
    ).populate('table', 'number status')
     .populate('waiter', 'name lastname')
     .populate('customer', 'personalInfo');

    // Facturar solo la primera vez que llega a "delivered" (evita duplicar
    // la venta si el estado se mueve delivered -> otro -> delivered)
    if (status === 'delivered' && previousOrder.status !== 'delivered') {
      await generateInvoice(order);
    }

    return res.status(200).json({ message: "Order updated", data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cancela un pedido (no lo borra, solo lo marca "cancelled") exigiendo la
// contraseña de un administrador como confirmación, ya que cancelar un
// pedido ya tomado puede implicar pérdidas para el negocio.
orderController.cancelOrder = async (req, res) => {
  try {
    const { adminPassword } = req.body;
    if (!adminPassword) {
      return res.status(400).json({ message: "Se requiere la contraseña del administrador para cancelar el pedido." });
    }

    const admins = await AdminModel.find().select("loginInfo.password");
    let authorized = false;
    for (const admin of admins) {
      if (await bcryptjs.compare(adminPassword, admin.loginInfo.password)) {
        authorized = true;
        break;
      }
    }

    if (!authorized) {
      return res.status(401).json({ message: "Contraseña de administrador incorrecta." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: 'cancelled' },
        $push: { statusHistory: { status: 'cancelled', changedAt: new Date() } }
      },
      { new: true }
    ).populate('table', 'number status')
     .populate('waiter', 'name lastname')
     .populate('customer', 'personalInfo');

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order cancelled", data: order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Eliminar pedido
orderController.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order deleted" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

orderController.getWaiterDashboard = async (req, res) => {
  try {
    const waiterId = req.user.id; // o req.query.waiter si prefieres pasarlo explícito

    // Obtener todas las mesas
    const tables = await TablesModel.find().sort({ number: 1 });

    // Obtener pedidos locales activos del mesero (pending, preparing, ready, atrasado)
    const activeOrders = await Order.find({
      orderType: 'local',
      waiter: waiterId,
      status: { $in: ['pending', 'preparing', 'ready', 'atrasado'] }
    })
    .populate('table', 'number status')
    .sort({ createdAt: -1 });

    // Combinar mesas con sus pedidos activos
    const dashboard = tables.map(table => {
      const ordersForTable = activeOrders.filter(
        order => order.table._id.toString() === table._id.toString()
      );
      return {
        _id: table._id,
        number: table.number,
        status: table.status,
        activeOrders: ordersForTable.map(order => ({
          _id: order._id,
          status: order.status,
          total: order.total,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: order.createdAt
        }))
      };
    });

    res.status(200).json(dashboard);
  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default orderController;
