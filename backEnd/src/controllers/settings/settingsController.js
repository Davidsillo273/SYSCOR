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
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Actualiza la configuración. Solo llegan aquí los administradores.
// Se aceptan cambios parciales: lo que no venga en el body se queda como estaba.
settingsController.updateSettings = async (req, res) => {
  try {
    const { operation, notifications } = req.body;
    const settings = await settingsUtils.getOrCreateSettings();

    if (operation) {
      const { lowStockThresholds, autoRefreshDashboard, dashboardRefreshSeconds } = operation;

      if (lowStockThresholds) {
        // Cada sección tiene su propio umbral; solo se tocan las que vengan en el body.
        // "inventory" no está aquí: desde que el umbral es obligatorio por insumo, ya
        // no existe un umbral general configurable para esa sección.
        const sections = ["drinks", "saucers", "extras", "combos"];
        for (const section of sections) {
          if (lowStockThresholds[section] !== undefined) {
            const threshold = Number(lowStockThresholds[section]);
            if (isNaN(threshold) || threshold < 0) {
              return res.status(400).json({ title: "Umbral inválido", message: `El umbral de stock bajo para ${section} debe ser un número positivo.` });
            }
            settings.operation.lowStockThresholds[section] = threshold;
          }
        }
      }

      if (autoRefreshDashboard !== undefined) {
        settings.operation.autoRefreshDashboard = Boolean(autoRefreshDashboard);
      }

      if (dashboardRefreshSeconds !== undefined) {
        const seconds = Number(dashboardRefreshSeconds);
        // Menos de 10 segundos saturaría el servidor con recargas innecesarias
        if (isNaN(seconds) || seconds < 10) {
          return res.status(400).json({ title: "Intervalo inválido", message: "El intervalo de actualización debe ser de al menos 10 segundos." });
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

    return res.status(200).json({ title: "Ajustes actualizados", message: "La configuración se actualizó correctamente.", data: settings });
  } catch (error) {
    console.error("settingsController.updateSettings:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

export default settingsController;
