// Importamos la utilidad que obtiene (o crea) el documento único de ajustes
// y la utilidad de notificaciones para avisar cuando la configuración cambia
import settingsUtils from "../../utils/settings/settingsUtils.js";
import notificationUtils from "../../utils/notifications/notificationUtils.js";

const settingsController = {};

// Devuelve la configuración actual del sistema.
// Si todavía no existe, se crea con los valores por defecto.
settingsController.getSettings = async (req, res) => {
  try {
    const settings = await settingsUtils.getOrCreateSettings();
    return res.status(200).json(settings);
  } catch (error) {
    console.error("settingsController.getSettings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza la configuración. Solo llegan aquí los administradores.
// Se aceptan cambios parciales: lo que no venga en el body se queda como estaba.
settingsController.updateSettings = async (req, res) => {
  try {
    const { operation, notifications } = req.body;
    const settings = await settingsUtils.getOrCreateSettings();

    if (operation) {
      const { lowStockThreshold, autoRefreshDashboard, dashboardRefreshSeconds } = operation;

      if (lowStockThreshold !== undefined) {
        const threshold = Number(lowStockThreshold);
        if (isNaN(threshold) || threshold < 0) {
          return res.status(400).json({ message: "Low stock threshold must be a positive number." });
        }
        settings.operation.lowStockThreshold = threshold;
      }

      if (autoRefreshDashboard !== undefined) {
        settings.operation.autoRefreshDashboard = Boolean(autoRefreshDashboard);
      }

      if (dashboardRefreshSeconds !== undefined) {
        const seconds = Number(dashboardRefreshSeconds);
        // Menos de 10 segundos saturaría el servidor con recargas innecesarias
        if (isNaN(seconds) || seconds < 10) {
          return res.status(400).json({ message: "Refresh interval must be at least 10 seconds." });
        }
        settings.operation.dashboardRefreshSeconds = seconds;
      }
    }

    if (notifications) {
      // Recorremos solo las categorías que existen en el schema para que nadie
      // pueda inyectar llaves nuevas desde el frontend
      const categories = ["orders", "staff", "inventory", "tables", "menu", "clients"];
      for (const category of categories) {
        if (notifications[category] !== undefined) {
          settings.notifications[category] = Boolean(notifications[category]);
        }
      }
    }

    await settings.save();

    await notificationUtils.createNotification({
      req,
      category: "settings",
      action: "updated",
      title: "Ajustes actualizados",
      message: (actor) => `${actor.name} actualizó la configuración general del sistema`,
      icon: "cog",
      severity: "info",
      entity: { model: "Settings", id: settings._id, label: "Ajustes" },
    });

    return res.status(200).json({ message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.error("settingsController.updateSettings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default settingsController;
