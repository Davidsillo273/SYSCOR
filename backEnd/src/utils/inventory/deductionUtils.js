// Servicio centralizado de descuento de inventario. Cualquier parte del
// sistema que consuma un insumo (crear un compuesto, pedir un extra, cocina
// confirmando una orden) pasa por aquí, para que la conversión de unidades,
// el registro en el log y la alerta de stock bajo se hagan siempre igual.
import InventoryModel from "../../models/inventory/inventoryModel.js";
import InventoryLogsModel from "../../models/inventory/inventoryLogsModel.js";
import SaucersModel from "../../models/menu/saucersModel.js";
import notificationUtils from "../notifications/notificationUtils.js";
import { convert } from "../units/unitsUtils.js";
import { cascadeDisableCombos } from "../menu/cascadeUtils.js";

// Revisa si un insumo quedó por debajo de su propio mínimo (lowStockAlert es
// obligatorio por insumo, ver inventoryModel) y levanta una alerta. La usan
// tanto el controlador de inventario (altas/ediciones manuales) como este servicio.
export const notifyIfLowStock = async (req, product) => {
  try {
    // Insumos antiguos que todavía no tengan el umbral definido (de antes de
    // que fuera obligatorio) simplemente no generan esta alerta.
    if (product.lowStockAlert === undefined || product.lowStockAlert === null) return;
    const threshold = product.lowStockAlert;

    if (Number(product.quantity) > threshold) return;

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "low_stock",
      title: "Alerta de stock",
      message: `Stock bajo: ${product.name} quedó en ${product.quantity} unidades (mínimo ${threshold})`,
      icon: "triangle-exclamation",
      severity: "warning",
      entity: { model: "Inventory", id: product._id, label: product.name },
    });
  } catch (error) {
    console.error("deductionUtils.notifyIfLowStock:", error);
  }
};

// Revisa los platillos activos que dependen de este insumo (receta con
// tracked:true) y, si alguno ya no tiene stock suficiente para prepararse,
// lo deshabilita automáticamente (y en cascada, los combos que lo incluyan).
export const disableDependentSaucers = async (req, insumo) => {
  try {
    const dependentSaucers = await SaucersModel.find({
      status: "Activo",
      recipe: { $elemMatch: { tracked: true, inventoryId: insumo._id } },
    });

    for (const saucer of dependentSaucers) {
      const recipeItem = saucer.recipe.find(
        (r) => r.tracked && String(r.inventoryId) === String(insumo._id)
      );
      if (!recipeItem || !recipeItem.quantity) continue;

      let neededInBase;
      try {
        neededInBase = convert(recipeItem.quantity, recipeItem.unit || insumo.unit, insumo.unit);
      } catch {
        continue; // unidades incompatibles: no se puede evaluar, se deja como está
      }

      if (Number(insumo.quantity) >= neededInBase) continue;

      await SaucersModel.findByIdAndUpdate(saucer._id, { status: "Inactivo" });

      await notificationUtils.createNotification({
        req,
        category: "menu",
        action: "status_changed",
        title: "Platillo deshabilitado automáticamente",
        message: `El platillo ${saucer.name} se deshabilitó por falta de stock de ${insumo.name}`,
        icon: "utensils",
        severity: "warning",
        entity: { model: "Saucers", id: saucer._id, label: saucer.name },
      });

      await cascadeDisableCombos(req, saucer._id, saucer.name);
    }
  } catch (error) {
    console.error("deductionUtils.disableDependentSaucers:", error);
  }
};

// Descuenta una cantidad del stock de UN insumo, convirtiendo unidades si hace
// falta. Nunca lanza hacia arriba: siempre devuelve { ok, error?, insumo?,
// insufficient? } para que quien llama decida cómo avisar sin romper el flujo
// de negocio (crear el compuesto, confirmar el pedido, etc. nunca se cancelan
// solo porque el stock no alcanzó).
export const deductFromInventory = async ({
  req,
  ingredientId,
  quantity,
  unit,
  origin,
  originId,
  actor,
}) => {
  try {
    if (!ingredientId || !quantity) return { ok: true };

    const insumo = await InventoryModel.findById(ingredientId);
    if (!insumo) {
      return { ok: false, error: `El insumo referenciado ya no existe.` };
    }

    let quantityInBase;
    try {
      quantityInBase = convert(quantity, unit || insumo.unit, insumo.unit);
    } catch (conversionError) {
      // No se puede descontar (unidades incompatibles): se reporta y no se toca el stock
      return { ok: false, error: conversionError.message, insumo };
    }

    const stockBefore = Number(insumo.quantity) || 0;
    const insufficient = stockBefore < quantityInBase;

    // Decremento atómico. No se usa updateInventory: ese exige el formulario
    // completo y fuerza pending:false, no sirve para un ajuste programático.
    const updated = await InventoryModel.findByIdAndUpdate(
      ingredientId,
      { $inc: { quantity: -quantityInBase } },
      { new: true }
    );

    const resolvedActor = actor || (req ? await notificationUtils.resolveActor(req) : null);

    await InventoryLogsModel.create({
      ingredientId,
      action: "deduct",
      quantity,
      unit: unit || insumo.unit,
      quantityInBase,
      resultingStock: updated.quantity,
      origin,
      originId,
      operatorId: resolvedActor?.id || null,
      operatorName: resolvedActor?.name || null,
    });

    await notifyIfLowStock(req, updated);
    await disableDependentSaucers(req, updated);

    return { ok: true, insufficient, insumo: updated };
  } catch (error) {
    console.error("deductionUtils.deductFromInventory:", error);
    return { ok: false, error: "No se pudo descontar el inventario." };
  }
};

// Recorre una receta (de un insumo compuesto, un platillo o una bebida) y
// descuenta cada ingrediente rastreado, multiplicado por la cantidad producida
// o pedida. Los ingredientes "solo receta" (tracked:false o sin inventoryId,
// ej. agua) se saltan silenciosamente: son informativos por diseño.
export const deductRecipe = async ({ req, recipe = [], multiplier = 1, origin, originId }) => {
  const results = [];
  if (!Array.isArray(recipe) || recipe.length === 0) return { results, insufficient: [] };

  // Resolvemos el actor una sola vez para todos los ingredientes de esta receta
  const actor = req ? await notificationUtils.resolveActor(req) : null;

  for (const item of recipe) {
    if (!item.tracked || !item.inventoryId) continue;
    if (!item.quantity) continue;

    const result = await deductFromInventory({
      req,
      ingredientId: item.inventoryId,
      quantity: Number(item.quantity) * multiplier,
      unit: item.unit,
      origin,
      originId,
      actor,
    });

    results.push({ ingredientId: item.inventoryId, name: item.name, ...result });
  }

  const insufficient = results.filter((r) => r.insufficient || !r.ok);
  return { results, insufficient };
};

export default { notifyIfLowStock, deductFromInventory, deductRecipe, disableDependentSaucers };
