import Order from "../../models/orders/orderModel.js";
import Combos from "../../models/menu/combosModel.js";
import Drinks from "../../models/menu/drinksModel.js";
import Extras from "../../models/menu/extrasModel.js";
import TablesModel from "../../models/tables/tablesModel.js";
const orderController = {};

// Crear comanda
orderController.createOrder = async (req, res) => {
   try {
    const { table, items } = req.body;
    const waiter = req.user.id;

    const tableDoc = await Table.findById(table);
    if (!tableDoc) return res.status(404).json({ message: "Mesa no encontrada" });

    // Solo se pueden crear órdenes si la mesa está ocupada
    if (tableDoc.status !== 'ocupada') {
      return res.status(400).json({ message: "Solo se pueden tomar órdenes en mesas ocupadas" });
    }

    // Procesar items
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
      table,
      waiter,
      items: processedItems,
      total,
      status: 'pending'
    });

    await newOrder.save();

    const populated = await Order.findById(newOrder._id)
      .populate('table', 'number status')
      .populate('waiter', 'name lastname');

    return res.status(201).json({ message: "Order created", data: populated });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Obtener órdenes con filtros
orderController.getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.table) filter.table = req.query.table;
    if (req.query.waiter) filter.waiter = req.query.waiter;
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate('table', 'number status')
      .populate('waiter', 'name lastname')
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cambiar estado de una orden
orderController.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('table', 'number status')
     .populate('waiter', 'name lastname');

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order updated", data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Eliminar comanda
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

    // Obtener órdenes activas del mesero (pending, preparing, ready)
    const activeOrders = await Order.find({
      waiter: waiterId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    })
    .populate('table', 'number status')
    .sort({ createdAt: -1 });

    // Combinar mesas con sus órdenes activas
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