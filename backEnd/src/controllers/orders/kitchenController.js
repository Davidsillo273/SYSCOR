import Order from "../../models/orders/orderModel.js";
import Cart from "../../models/orders/cartModel.js";

const kitchenController = {};

kitchenController.getKitchenOrders = async (req, res) => {
  try {
    // Comandas físicas pendientes o en preparación
    const physicalOrders = await Order.find({
      status: { $in: ['pending', 'preparing'] }
    })
      .populate('table', 'number')
      .populate('waiter', 'name')
      .lean();

    // Carritos en línea pagados/confirmados
    const onlineCarts = await Cart.find({
      status: { $in: ['paid', 'confirmed'] }  // ajusta según tu lógica de pago
    })
      .populate('idCustomer', 'name email')
      .populate('details.combos.comboId', 'name price')
      .populate('details.extras.extraId', 'name price')
      .populate('details.extras.drinks.drinkId', 'name price')
      .lean();

    // Formatear respuesta unificada
    const formattedPhysical = physicalOrders.map(order => ({
      _id: order._id,
      type: 'dine-in',
      tableNumber: order.table?.number,
      waiter: order.waiter?.name,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes
      })),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    }));

    const formattedOnline = onlineCarts.map(cart => {
      const items = [];
      cart.details?.forEach(detail => {
        detail.combos?.forEach(c => {
          items.push({
            name: c.comboId?.name || 'Combo',
            quantity: c.quantity || 1,
            notes: ''
          });
        });
        detail.extras?.forEach(e => {
          items.push({
            name: e.extraId?.name || 'Extra',
            quantity: e.quantity || 1,
            notes: ''
          });
          e.drinks?.forEach(d => {
            items.push({
              name: d.drinkId?.name || 'Bebida',
              quantity: 1,
              notes: ''
            });
          });
        });
      });
      return {
        _id: cart._id,
        type: 'online',
        customer: cart.idCustomer?.name || 'Cliente',
        items,
        total: cart.total,
        status: cart.status === 'paid' ? 'pending' : cart.status,
        createdAt: cart.createdAt
      };
    });

    // Combinar y ordenar por más antiguo primero
    const allOrders = [...formattedPhysical, ...formattedOnline].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return res.status(200).json(allOrders);
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default kitchenController;