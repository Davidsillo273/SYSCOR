// Asistente de chat para registrar platillos por conversación en vez de
// llenar el formulario. Gemini solo decide CUÁNDO llamar a create_saucer y
// con qué argumentos: la escritura real a Mongo la hace este controller.
import SaucersModel from "../../models/menu/saucersModel.js";
import { findByNameInsensitive } from "../../utils/common/duplicateNameUtils.js";
import { handleChatWithTools, sendFunctionResult } from "../../utils/chat/geminiUtils.js";

const FALLBACK_REPLY = "El asistente no está disponible en este momento. Podés registrar el platillo desde el formulario manual.";

const SYSTEM_PROMPT = `Eres un asistente de registro para SYSCOR, el sistema de gestión de
Taquería El Corral en El Salvador. Tu única función en este chat es
ayudar a registrar platillos nuevos en el sistema.

Cuando el usuario quiera registrar un platillo, recopilá la siguiente
información de forma conversacional (no pidas todo de una vez):
nombre, categoría (drinks / general / mexican_specialty), precio en USD,
y si es un platillo de tacos (sí/no).

Una vez que tengas todos los datos obligatorios (nombre, categoría,
precio), llamá a la función create_saucer con esos valores.

Si el usuario escribe categorías en español (bebidas, general,
especialidades mexicanas), convertílas al enum correcto antes de llamar
la función.

Si el usuario da un precio inválido (negativo o cero), pedile que
lo corrija antes de llamar la función.

No inventes datos. Si el usuario no menciona un campo opcional,
usá el valor por defecto. Responde siempre en español.`;

const CREATE_SAUCER_TOOL = {
  name: "create_saucer",
  description: "Registra un nuevo platillo en el sistema SYSCOR de Taquería El Corral.",
  parameters: {
    type: "OBJECT",
    properties: {
      name: { type: "STRING", description: "Nombre del platillo" },
      category: {
        type: "STRING",
        enum: ["drinks", "general", "mexican_specialty"],
        description: "Categoría del platillo",
      },
      price: { type: "NUMBER", description: "Precio en USD, mayor a 0" },
      isTaco: { type: "BOOLEAN", description: "Si es un platillo de tacos (por defecto false)" },
      status: { type: "STRING", description: "Estado del platillo (por defecto 'active')" },
    },
    required: ["name", "category", "price"],
  },
};

// El catálogo real de Saucers usa categorías en español (Burritos, Tortas,
// Tacos, Sopas, Especiales) muy distintas al enum genérico que usa esta
// herramienta de chat. Se traduce acá para no exponerle a Gemini el
// catálogo completo del menú. isTaco manda: si viene true, la categoría
// real siempre es "Tacos" sin importar qué mandó el enum genérico.
const GENERIC_CATEGORY_TO_SAUCER_CATEGORY = {
  general: "Burritos",
  mexican_specialty: "Especiales",
  drinks: "Especiales",
};

const mapCategory = (category, isTaco) => {
  if (isTaco) return "Tacos";
  return GENERIC_CATEGORY_TO_SAUCER_CATEGORY[category] || "Especiales";
};

const mapStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (["inactive", "inactivo", "agotado", "no disponible"].includes(normalized)) return "Inactivo";
  return "Activo";
};

// Ejecuta de verdad la creación del platillo a partir de lo que Gemini
// extrajo del mensaje del usuario. Nunca lanza: siempre devuelve un
// resultado { success, ... } para que el controller decida cómo seguir.
const createSaucerFromArgs = async (args = {}) => {
  const name = typeof args.name === "string" ? args.name.trim() : "";
  if (name.length < 3) {
    return { success: false, error: "invalid_name", message: "El nombre del platillo debe tener al menos 3 caracteres." };
  }

  const price = Number(args.price);
  if (!price || price <= 0) {
    return { success: false, error: "invalid_price", message: "El precio debe ser un número mayor a 0." };
  }

  const existing = await findByNameInsensitive(SaucersModel, name);
  if (existing) {
    return {
      success: false,
      error: "duplicate_name",
      message: `Ya existe un platillo llamado "${existing.name}" (precio $${Number(existing.price).toFixed(2)}, categoría ${existing.category}, estado ${existing.status}).`,
      existing: { id: existing._id, name: existing.name, price: existing.price, category: existing.category },
    };
  }

  const isTaco = Boolean(args.isTaco);
  const category = mapCategory(args.category, isTaco);

  try {
    const newSaucer = new SaucersModel({
      name,
      category,
      price,
      status: mapStatus(args.status),
      // Los platillos de tacos se venden por cantidad fija; 3 es el mínimo válido.
      // El admin puede ajustarlo después desde el formulario.
      quantity: category === "Tacos" ? 3 : undefined,
      // La receta no se pide por chat: queda vacía y se completa luego desde
      // el formulario, igual que los insumos "pendientes" de Inventario.
      recipe: [],
    });

    await newSaucer.save();

    return { success: true, saucer: newSaucer };
  } catch (error) {
    console.error("saucerChatController.createSaucerFromArgs:", error);
    return { success: false, error: "save_failed", message: "No se pudo guardar el platillo por un error interno." };
  }
};

const saucerChatController = {};

saucerChatController.chat = async (req, res) => {
  const { message, history } = req.body || {};
  const safeHistory = Array.isArray(history) ? history : [];

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ title: "Mensaje requerido", message: "El mensaje es requerido." });
  }

  try {
    const result = await handleChatWithTools({
      history: safeHistory,
      message,
      tools: [CREATE_SAUCER_TOOL],
      systemPrompt: SYSTEM_PROMPT,
    });

    // Gemini no respondió (sin API key, timeout, error de red...): nunca
    // bloqueamos el flujo, el admin siempre puede usar el formulario manual.
    if (result.type === "error") {
      return res.status(200).json({ reply: FALLBACK_REPLY, history: safeHistory, saucerCreated: null });
    }

    // Gemini sigue recopilando datos o respondiendo una pregunta: se muestra tal cual
    if (result.type === "text") {
      return res.status(200).json({ reply: result.text, history: result.history, saucerCreated: null });
    }

    if (result.type === "function_call" && result.name === "create_saucer") {
      const outcome = await createSaucerFromArgs(result.args);

      const followUp = await sendFunctionResult({
        history: result.history,
        functionName: "create_saucer",
        result: outcome.success
          ? {
              success: true,
              saucer: {
                id: outcome.saucer._id,
                name: outcome.saucer.name,
                category: outcome.saucer.category,
                price: outcome.saucer.price,
                status: outcome.saucer.status,
              },
            }
          : { success: false, error: outcome.error, message: outcome.message },
        systemPrompt: SYSTEM_PROMPT,
      });

      // Si Gemini no logra redactar el cierre, igual respondemos algo útil
      // con lo que ya sabemos que pasó de verdad en la base de datos.
      if (followUp.type !== "text") {
        return res.status(200).json({
          reply: outcome.success
            ? `Listo, registré "${outcome.saucer.name}" en el menú.`
            : outcome.message || "No se pudo registrar el platillo.",
          history: followUp.history || result.history,
          saucerCreated: outcome.success ? outcome.saucer : null,
        });
      }

      return res.status(200).json({
        reply: followUp.text,
        history: followUp.history,
        saucerCreated: outcome.success ? outcome.saucer : null,
      });
    }

    // Ni texto ni function call reconocible: se loguea y se avisa genérico
    console.error("saucerChatController.chat: respuesta de Gemini sin texto ni function call válida");
    return res.status(200).json({
      reply: "No entendí bien tu mensaje, ¿podrías reformularlo?",
      history: result.history || safeHistory,
      saucerCreated: null,
    });
  } catch (error) {
    console.error("saucerChatController.chat:", error);
    return res.status(200).json({ reply: FALLBACK_REPLY, history: safeHistory, saucerCreated: null });
  }
};

export default saucerChatController;
