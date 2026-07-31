const tablesController = {};

// Importamos el modelo de las mesas para interactuar con la base de datos
import TablesModel from "../../models/tables/tablesModel.js";
import Order from "../../models/orders/orderModel.js";
// Utilidad para registrar los movimientos como notificaciones del sistema
import notificationUtils from "../../utils/notifications/notificationUtils.js";

// Obtiene todas las mesas registradas en el restaurante
tablesController.getTables = async (req, res) => {
  try {
    const tables = await TablesModel.find();
    return res.status(200).json(tables);
  } catch (error) {
    console.error("tablesController.getTables:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Crea o registra una nueva mesa en el sistema
tablesController.insertTable = async (req, res) => {
  try {
    let { number, status } = req.body;

    
    // Preparamos la nueva mesa para guardarla
    const newTable = new TablesModel({
      number,
      status,
    });

    // Guardamos la mesa en la base de datos
    await newTable.save();

    await notificationUtils.createNotification({
      req,
      category: "tables",
      action: "created",
      title: "Nueva mesa",
      message: (actor) => `${actor.name} habilitó la Mesa ${newTable.number}`,
      icon: "chair",
      severity: "success",
      entity: { model: "Tables", id: newTable._id, label: `Mesa ${newTable.number}` },
    });

    return res.status(201).json({ title: "Mesa agregada", message: "La mesa se guardó correctamente." });
  } catch (error) {
    console.error("tablesController.insertTable:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Elimina una mesa existente usando su ID
tablesController.deleteTable = async (req, res) => {
  try {
    const deletedTable = await TablesModel.findByIdAndDelete(req.params.id);

    // Si no encuentra la mesa, devuelve un error 404 (No encontrado)
    if (!deletedTable) {
      return res.status(404).json({ title: "Mesa no encontrada", message: "No se encontró la mesa solicitada." });
    }

    await notificationUtils.createNotification({
      req,
      category: "tables",
      action: "deleted",
      title: "Mesa eliminada",
      message: (actor) => `${actor.name} eliminó la Mesa ${deletedTable.number}`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Tables", id: deletedTable._id, label: `Mesa ${deletedTable.number}` },
    });

    return res.status(200).json({ title: "Mesa eliminada", message: "La mesa se eliminó correctamente." });
  } catch (error) {
    console.error("tablesController.deleteTable:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Actualiza los datos de una mesa (por ejemplo, para cambiarla de libre a ocupada)
tablesController.updateTable = async (req, res) => {
  try {
    const { number, status } = req.body;

    // Validar que el estado sea uno de los permitidos
    const validStatuses = ['libre', 'ocupada', 'limpieza', 'reservada'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado no válido" });
    }

    const previousTable = await TablesModel.findById(req.params.id).select("status");
    if (!previousTable) {
      return res.status(404).json({ message: "Mesa no encontrada" });
    }

    const tableUpdated = await TablesModel.findByIdAndUpdate(
      req.params.id,
      { number, status },
      { new: true }
    );

    // Si la mesa pasa a 'libre' o 'limpieza', cancelar todas las órdenes activas
    if (status && ['libre', 'limpieza'].includes(status) && previousTable.status !== status) {
      await Order.updateMany(
        { table: tableUpdated._id, status: { $in: ['pending', 'preparing', 'ready'] } },
        { $set: { status: 'cancelled' } }
      );
    }

    // Notificación (tu lógica existente)
    await notificationUtils.createNotification({
      req,
      category: "tables",
      action: status && previousTable.status !== status ? "status_changed" : "updated",
      title: status ? "Mesa cambió de estado" : "Mesa actualizada",
      message: (actor) =>
        status
          ? `${actor.name} cambió la Mesa ${tableUpdated.number} a ${tableUpdated.status}`
          : `${actor.name} actualizó los datos de la Mesa ${tableUpdated.number}`,
      icon: "chair",
      severity: "info",
      entity: { model: "Tables", id: tableUpdated._id, label: `Mesa ${tableUpdated.number}` },
    });

    return res.status(200).json({ message: "Mesa actualizada", data: tableUpdated });
  } catch (error) {
    console.error("tablesController.updateTable:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default tablesController;