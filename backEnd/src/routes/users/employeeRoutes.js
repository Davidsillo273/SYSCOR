import express from "express";
import employeeController from "../../controllers/users/employeeController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import ownsResourceOrIsAdmin from "../../middlewares/auth/ownershipMiddleware.js";
import upload from "../../utils/cloudinaryConfig.js";
const router = express.Router();

// Listar todos los empleados es información administrativa: solo admin
/**
 * @swagger
 * /users/employees:
 *   get:
 *     summary: Lista los empleados registrados
 *     description: Solo admin. Soporta filtros de búsqueda vía query string (mismos criterios que crudUtils.searchDocuments).
 *     tags: [Usuarios - Empleados]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Arreglo de empleados.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/").get(validateAuthCookie(["admin"]), employeeController.getEmployees);

// El propio empleado puede editar su ficha, o un admin editar la de cualquiera.
// employeeController.updateEmployee ya restringe qué campos puede tocar un
// empleado que se edita a sí mismo (ver comentario ahí: salario/estado/permisos
// quedan reservados a admin).
/**
 * @swagger
 * /users/employees/{id}:
 *   patch:
 *     summary: Actualiza los datos de un empleado
 *     description: Admin (cualquier empleado, todos los campos) o el propio empleado (solo su ficha, verificado por ownership; no puede tocar puesto, salario, estado ni permisos, aunque el endpoint sea el mismo).
 *     tags: [Usuarios - Empleados]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del empleado a actualizar.
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Ana" }
 *               lastname: { type: string, example: "López" }
 *               phone: { type: string, example: "7000-4321" }
 *               address: { type: string, example: "Col. Miramonte, San Salvador" }
 *               type: { type: string, example: "cocina", description: "Solo admin." }
 *               salary: { type: number, example: 450, description: "Solo admin." }
 *               shift: { type: string, example: "mañana" }
 *               schedule: { type: string, example: "08:00 - 17:00" }
 *               workDays:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["lunes", "martes"]
 *               scheduleStart: { type: string, example: "08:00" }
 *               scheduleEnd: { type: string, example: "17:00" }
 *               weekendScheduleEnabled: { type: boolean, example: false }
 *               weekendScheduleStart: { type: string, example: null, nullable: true }
 *               weekendScheduleEnd: { type: string, example: null, nullable: true }
 *               status: { type: string, enum: [active, inactive], example: "active", description: "Solo admin." }
 *               permissions:
 *                 type: array
 *                 items: { type: string }
 *                 example: []
 *                 description: "Solo admin."
 *               image: { type: string, format: binary, description: "Nueva foto de perfil opcional." }
 *     responses:
 *       200:
 *         description: Empleado actualizado; devuelve el documento actualizado (sin password).
 *       400:
 *         description: Datos inválidos (nombre, teléfono, dirección, tipo, salario, estado o permisos).
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Un empleado editando su propio perfil intentó modificar puesto/salario/estado/permisos, o intentó editar el perfil de otra persona.
 *       404:
 *         description: No se encontró el empleado solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/:id", validateAuthCookie(["admin", "employee"]), ownsResourceOrIsAdmin, upload.single("image"), employeeController.updateEmployee);

/**
 * @swagger
 * /users/employees/{id}/send-password-reset:
 *   post:
 *     summary: Envía al empleado un enlace para definir una nueva contraseña
 *     description: Solo admin. El admin nunca escribe la nueva contraseña; se manda un correo con un enlace firmado para que el propio empleado la defina.
 *     tags: [Usuarios - Empleados]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del empleado.
 *     responses:
 *       200:
 *         description: Invitación de cambio de contraseña enviada al correo del empleado.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       404:
 *         description: No se encontró el empleado solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/:id/send-password-reset", validateAuthCookie(["admin"]), employeeController.sendPasswordResetInvitation);

/**
 * @swagger
 * /users/employees/reset-password:
 *   post:
 *     summary: Define la nueva contraseña del empleado usando el token del correo
 *     description: Público (autorizado por el token firmado enviado al correo, no por cookie de sesión).
 *     tags: [Usuarios - Empleados]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string, example: "eyJhbGciOi..." }
 *               newPassword: { type: string, example: "NuevaClave#456" }
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Falta el token o la nueva contraseña, o la contraseña no cumple las reglas mínimas.
 *       401:
 *         description: El enlace venció o no corresponde a un cambio de contraseña.
 *       404:
 *         description: No se encontró el empleado asociado al token.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/reset-password", employeeController.resetPasswordWithToken);
export default router;
