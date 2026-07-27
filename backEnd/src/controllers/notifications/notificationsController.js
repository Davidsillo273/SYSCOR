// Importamos el modelo de notificaciones para consultar y actualizar los avisos del sistema
import notificationModel from "../../models/notifications/notificationsModel.js";

const notificationsController = {};

// Las notificaciones nunca muestran nada de hace más de 3 días. El índice TTL
// del modelo ya se encarga de borrarlas físicamente, pero ese barrido de
// MongoDB corre en segundo plano cada cierto tiempo (no es instantáneo), así
// que además filtramos por fecha aquí para que el corte de 3 días sea exacto
// aunque el documento todavía no haya sido eliminado.
const THREE_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 3;
const buildDateFilter = () => ({ createdAt: { $gte: new Date(Date.now() - THREE_DAYS_IN_MS) } });

// Devuelve las notificaciones que le corresponden al usuario según su rol,
// paginadas de 10 en 10 por defecto, junto con cuántas de ellas todavía no ha leído.
notificationsController.getNotifications = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { category } = req.query;

    // Cada notificación indica qué roles pueden verla, así el empleado
    // nunca ve movimientos de planilla, clientes ni configuración.
    const filter = { audience: role, ...buildDateFilter() };

    // Filtro opcional por área (órdenes, inventario, etc.)
    if (category) filter.category = category;

    // Paginación: 10 notificaciones por página salvo que pidan otra cosa
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      notificationModel.countDocuments(filter),
      // El contador de no leídas siempre se calcula sobre TODAS las visibles de
      // los últimos 3 días (no solo las de esta página), para que el número de
      // la campana sea real sin importar en qué página esté el usuario.
      notificationModel.countDocuments({ audience: role, readBy: { $ne: id }, ...buildDateFilter() }),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("notificationsController.getNotifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Marca una notificación puntual como leída para el usuario actual.
// Usamos $addToSet para que marcarla dos veces no duplique el registro.
notificationsController.markAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const notification = await notificationModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read", data: notification });
  } catch (error) {
    console.error("notificationsController.markAsRead:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Marca como leídas todas las notificaciones visibles para este usuario.
// Solo toca las que aún no había leído.
notificationsController.markAllAsRead = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const result = await notificationModel.updateMany(
      { audience: role, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("notificationsController.markAllAsRead:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Elimina definitivamente una notificación (solo administradores)
notificationsController.deleteNotification = async (req, res) => {
  try {
    const notification = await notificationModel.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("notificationsController.deleteNotification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default notificationsController;
