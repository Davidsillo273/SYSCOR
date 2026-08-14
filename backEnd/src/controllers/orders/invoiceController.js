import Invoice from "../../models/orders/invoiceModel.js";

const invoiceController = {};

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

export default invoiceController;
