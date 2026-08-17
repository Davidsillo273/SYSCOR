import Invoice from "../../models/orders/invoiceModel.js";
import Order from "../../models/orders/orderModel.js";

const invoiceController = {};

// Arma el rango [inicio, fin) de un día calendario a partir de un Date
const dayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// Historial de facturación. Estos registros no se crean a mano: los genera
// orderController.generateInvoice automáticamente cuando un pedido pasa a
// "delivered". Soporta filtrar por tipo (?orderType=local|online) igual que
// Pedidos, para poder mostrar los mismos labels en ambos apartados.
invoiceController.getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.orderType) filter.orderType = req.query.orderType;

    const invoices = await Invoice.find(filter).sort({ issuedAt: -1 });
    return res.status(200).json(invoices);
  } catch (error) {
    console.error("invoiceController.getInvoices:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Solo para corregir errores de facturación (ej. una venta duplicada); no es
// una acción que se use en el flujo normal.
invoiceController.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Registro de facturación no encontrado" });
    return res.status(200).json({ message: "Registro eliminado" });
  } catch (error) {
    console.error("invoiceController.deleteInvoice:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Todo lo que necesita el Dashboard (pestañas "Actividad" y "Análisis") en
// una sola llamada: ventas de hoy vs ayer (para el label y su gráfica),
// tendencia de los últimos 14 días, ventas por tipo de pedido, productos
// más vendidos, ticket promedio y pedidos operativos aún pendientes.
// Todo se calcula sobre "invoices" (ventas ya facturadas), salvo los
// pedidos pendientes, que por definición todavía no se facturaron.
invoiceController.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const today = dayRange(now);
    const yesterday = dayRange(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const [todayInvoices, yesterdayInvoices] = await Promise.all([
      Invoice.find({ issuedAt: { $gte: today.start, $lt: today.end } }),
      Invoice.find({ issuedAt: { $gte: yesterday.start, $lt: yesterday.end } }),
    ]);

    const netSalesToday = todayInvoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);

    // Tendencia de los últimos 14 días (incluye hoy), para la gráfica de Análisis
    const fourteenDaysAgo = new Date(today.start);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const recentInvoices = await Invoice.find({ issuedAt: { $gte: fourteenDaysAgo } })
      .select("issuedAt total orderType items")
      .lean();

    // Agrupamos manualmente por día en vez de usar el pipeline de agregación
    // de Mongo: son pocos registros (14 días) y así queda más fácil de leer/mantener
    const byDayMap = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDayMap[key] = { date: key, total: 0, count: 0 };
    }
    const byTypeMap = { local: { count: 0, total: 0 }, online: { count: 0, total: 0 } };
    const topItemsMap = {};

    for (const inv of recentInvoices) {
      const key = new Date(inv.issuedAt).toISOString().slice(0, 10);
      if (byDayMap[key]) {
        byDayMap[key].total += Number(inv.total) || 0;
        byDayMap[key].count += 1;
      }
      if (inv.orderType && byTypeMap[inv.orderType]) {
        byTypeMap[inv.orderType].count += 1;
        byTypeMap[inv.orderType].total += Number(inv.total) || 0;
      }
      for (const item of inv.items || []) {
        if (!item?.name) continue;
        if (!topItemsMap[item.name]) topItemsMap[item.name] = { name: item.name, quantity: 0, total: 0 };
        topItemsMap[item.name].quantity += Number(item.quantity) || 0;
        topItemsMap[item.name].total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      }
    }

    const topItems = Object.values(topItemsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthInvoices = await Invoice.find({ issuedAt: { $gte: monthStart } }).select("total").lean();
    const monthTotal = monthInvoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    const avgTicket = monthInvoices.length > 0 ? monthTotal / monthInvoices.length : 0;

    // Pedidos operativos que todavía no llegan a facturarse (para la tarjeta
    // "Pedidos Pendientes" del Dashboard)
    const pendingOrdersCount = await Order.countDocuments({
      status: { $in: ["pending", "preparing", "atrasado"] },
    });

    return res.status(200).json({
      today: {
        invoicedCount: todayInvoices.length,
        netSales: netSalesToday,
      },
      yesterday: {
        invoicedCount: yesterdayInvoices.length,
      },
      last14Days: Object.values(byDayMap),
      byOrderType: byTypeMap,
      topItems,
      avgTicket,
      monthTotal,
      pendingOrdersCount,
    });
  } catch (error) {
    console.error("invoiceController.getAnalytics:", error);
    return res.status(500).json({ title: "Error del servidor", message: "No se pudo calcular el análisis de ventas." });
  }
};

export default invoiceController;
