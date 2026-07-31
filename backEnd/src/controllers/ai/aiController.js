// Endpoints de asistencia con IA (Gemini). Todo lo que devuelven es una
// SUGERENCIA editable: el admin siempre puede ignorarla, cambiarla o
// simplemente no usarla. Ninguna conversión de unidades ni descuento de
// inventario pasa por aquí — eso vive en unitsUtils/deductionUtils.
import { callGemini } from "../../utils/ai/geminiUtils.js";
import InventoryModel from "../../models/inventory/inventoryModel.js";
import CartModel from "../../models/orders/cartModel.js";
import { UNIT_LIST } from "../../utils/units/unitsUtils.js";

const aiController = {};

// Sugiere una receta estándar para un insumo compuesto nuevo, a partir de su
// nombre y la cantidad que se quiere producir. El admin la ve como punto de
// partida, no como valor definitivo.
aiController.suggestRecipe = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;

    if (!name || !quantity || !unit) {
      return res.status(400).json({ title: "Datos incompletos", message: "Se necesita nombre, cantidad y unidad." });
    }

    const prompt = `Eres un asistente de cocina para un restaurante mexicano en El Salvador.
El admin quiere crear el ingrediente compuesto: ${name}.
Sugiere una receta estándar con cantidades para producir ${quantity} ${unit} de este ingrediente.
Devuelve SOLO un JSON con este formato exacto, sin texto adicional:
{ "ingredients": [{ "name": string, "quantity": number, "unit": string }] }
Usa solo estas unidades (en español): ${UNIT_LIST.join(", ")}.`;

    const suggestion = await callGemini(prompt);

    if (!suggestion || !Array.isArray(suggestion.ingredients)) {
      // La IA no respondió o falló: no es un error, simplemente no hay sugerencia
      return res.status(200).json({ ingredients: [] });
    }

    // Intentamos casar cada nombre sugerido contra insumos ya existentes
    // (por nombre, sin distinguir mayúsculas), para que el front pueda
    // ofrecer "ya existe" en vez de crear todo de cero.
    const matched = await Promise.all(
      suggestion.ingredients.map(async (item) => {
        if (!item?.name) return null;
        const existing = await InventoryModel.findOne({
          itemType: "producto",
          name: { $regex: `^${String(item.name).trim()}$`, $options: "i" },
        });
        return {
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unit: UNIT_LIST.includes(item.unit) ? item.unit : "unidad",
          inventoryId: existing?._id || null,
        };
      })
    );

    return res.status(200).json({ ingredients: matched.filter(Boolean) });
  } catch (error) {
    console.error("aiController.suggestRecipe:", error);
    // La sugerencia es un extra: si algo falla, el modal sigue funcionando sin ella
    return res.status(200).json({ ingredients: [] });
  }
};

// Proyección de qué insumos se van a agotar pronto, a partir del inventario
// actual y los pedidos de los últimos 7 días. Se cachea en memoria por el
// resto del día para no gastar cuota cada vez que alguien abre el dashboard.
let forecastCache = { date: null, data: null };

aiController.stockForecast = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const force = req.query.force === "true";

    if (!force && forecastCache.date === today && forecastCache.data) {
      return res.status(200).json(forecastCache.data);
    }

    const inventory = await InventoryModel
      .find({ itemType: "producto", status: { $ne: "Agotado" } })
      .select("name quantity unit lowStockAlert")
      .lean();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await CartModel
      .find({ createdAt: { $gte: sevenDaysAgo } })
      .select("details createdAt")
      .populate("details.combos.comboId", "name")
      .populate("details.extras.extraId", "name")
      .lean();

    // Resumen simple: cuántas veces se pidió cada combo/extra en la semana
    const ordersSummary = {};
    for (const cart of recentOrders) {
      for (const detail of cart.details || []) {
        for (const c of detail.combos || []) {
          const label = c.comboId?.name || "Combo";
          ordersSummary[label] = (ordersSummary[label] || 0) + (c.quantity || 1);
        }
        for (const e of detail.extras || []) {
          const label = e.extraId?.name || "Extra";
          ordersSummary[label] = (ordersSummary[label] || 0) + (e.quantity || 1);
        }
      }
    }

    const prompt = `Dado este inventario actual: ${JSON.stringify(inventory)}
y estos pedidos de los últimos 7 días: ${JSON.stringify(ordersSummary)},
¿qué ingredientes proyectás que se agotarán en los próximos 3 días?
Devuelve SOLO un JSON:
{ "alerts": [{ "ingredient": string, "currentStock": number, "unit": string, "projectedDaysLeft": number, "recommendation": string }] }`;

    const forecast = await callGemini(prompt);
    const data = { alerts: Array.isArray(forecast?.alerts) ? forecast.alerts : [] };

    forecastCache = { date: today, data };

    return res.status(200).json(data);
  } catch (error) {
    console.error("aiController.stockForecast:", error);
    // Sin proyección no pasa nada: el panel simplemente no muestra alertas
    return res.status(200).json({ alerts: [] });
  }
};

export default aiController;
