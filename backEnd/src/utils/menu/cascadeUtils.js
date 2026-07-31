// Utilidades de "cascada" para cuando un platillo deja de estar disponible:
// ningún combo que lo incluya puede seguir vendiéndose. Se usa tanto al
// deshabilitar un platillo manualmente como al deshabilitarlo automáticamente
// por falta de stock de algún ingrediente de su receta.
import CombosModel from "../../models/menu/combosModel.js";
import notificationUtils from "../notifications/notificationUtils.js";

export const cascadeDisableCombos = async (req, saucerId, saucerName) => {
  try {
    const affectedCombos = await CombosModel.find({ "saucers.saucerId": saucerId, status: "disponible" });
    if (affectedCombos.length === 0) return;

    await CombosModel.updateMany(
      { "saucers.saucerId": saucerId, status: "disponible" },
      { status: "no disponible" }
    );

    for (const combo of affectedCombos) {
      await notificationUtils.createNotification({
        req,
        category: "menu",
        action: "status_changed",
        title: "Combo deshabilitado automáticamente",
        message: `El combo ${combo.name} se deshabilitó porque el platillo ${saucerName} ya no está activo`,
        icon: "shopping-bag",
        severity: "warning",
        entity: { model: "Combos", id: combo._id, label: combo.name },
      });
    }
  } catch (error) {
    console.error("cascadeUtils.cascadeDisableCombos:", error);
  }
};

export default { cascadeDisableCombos };
