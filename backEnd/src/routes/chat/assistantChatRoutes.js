import express from "express";
import assistantChatController from "../../controllers/chat/assistantChatController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import { uploadToMemory } from "../../utils/cloudinaryConfig.js";

const router = express.Router();

// Cualquier admin o empleado con sesión puede hablar con el asistente; qué
// puede hacer DENTRO del chat se decide por herramienta (ver
// assistantChatController.canUseTool), igual que en el resto del sistema.
/**
 * @swagger
 * /chat/assistant:
 *   post:
 *     summary: Envía un mensaje al asistente de IA del sistema
 *     description: Admin o empleado. El asistente puede responder en texto, pedir ejecutar una acción sobre el sistema (según los permisos del usuario) o pedir un formulario corto si faltan datos obligatorios para una acción.
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string, example: "¿Cuánto stock de queso tengo?" }
 *               history: { type: string, description: "Historial de la conversación, como JSON string.", example: "[]" }
 *               context: { type: string, description: "Pantalla actual del sistema, para dar contexto ambiguo.", example: "inventario" }
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *                 description: Hasta 4 imágenes adjuntas.
 *     responses:
 *       200:
 *         description: "{ reply, history, kind: 'text'|'form'|'action', ... }. Incluye form cuando faltan datos, o actionSuccess/attachedImageUrls cuando se ejecutó una acción. Los errores de la IA se devuelven como 200 con una respuesta de fallback (no se propagan como error HTTP)."
 *       400:
 *         description: No se envió mensaje ni archivos adjuntos.
 *       401:
 *         description: No autenticado.
 */
router.post(
  "/assistant",
  validateAuthCookie(["admin", "employee"]),
  uploadToMemory.array("files", 4),
  assistantChatController.chat
);

/**
 * @swagger
 * /chat/assistant/form:
 *   post:
 *     summary: Envía el formulario corto que el asistente pidió para completar una acción
 *     description: Admin o empleado. Se usa cuando /chat/assistant respondió con kind "form"; ejecuta la herramienta directamente con los argumentos ya completos, sin volver a pasar por la IA para interpretar texto.
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tool, args]
 *             properties:
 *               tool: { type: string, example: "createInventoryItem" }
 *               args: { type: object, example: { "name": "Queso rallado", "quantity": 10, "unit": "kilogramo" } }
 *               history: { type: array, items: { type: object }, example: [] }
 *     responses:
 *       200:
 *         description: "{ reply, history, kind: 'action', actionSuccess }. Si la ejecución de la herramienta falla internamente, igual responde 200 con un mensaje de fallback (no se propaga como error HTTP)."
 *       400:
 *         description: La herramienta indicada no existe, o siguen faltando campos obligatorios.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: El usuario no tiene permiso para usar esta herramienta.
 */
router.post(
  "/assistant/form",
  validateAuthCookie(["admin", "employee"]),
  assistantChatController.submitForm
);

export default router;
