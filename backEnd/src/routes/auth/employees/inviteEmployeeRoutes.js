import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteEmployeeController from "../../../controllers/auth/employees/inviteEmployeeController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

/**
 * @swagger
 * /auth/employees/invite/send-invitation:
 *   post:
 *     summary: Invita a una persona a unirse como empleado
 *     description: Solo admin. Define los datos personales y laborales del puesto (los descuentos de ley AFP/ISSS/renta se calculan automáticamente a partir del salario) y envía un correo con el enlace de invitación.
 *     tags: [Auth - Employees]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastname, phone, duiNit, address, type, salary]
 *             properties:
 *               email: { type: string, example: "empleado@correo.com" }
 *               name: { type: string, example: "Ana" }
 *               lastname: { type: string, example: "López" }
 *               phone: { type: string, example: "7000-4321" }
 *               duiNit: { type: string, example: "01234567-8" }
 *               address: { type: string, example: "Col. Miramonte, San Salvador" }
 *               type: { type: string, example: "cocina" }
 *               salary: { type: number, example: 450 }
 *               additionalPay: { type: number, example: 0 }
 *               workInsurance: { type: boolean, example: true }
 *               workDays:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["lunes", "martes", "miércoles"]
 *               scheduleStart: { type: string, example: "08:00" }
 *               scheduleEnd: { type: string, example: "17:00" }
 *               permissions:
 *                 type: array
 *                 items: { type: string }
 *                 example: []
 *     responses:
 *       200:
 *         description: Invitación enviada correctamente; incluye el desglose de planilla (grossSalary, afp, isss, isr, netSalary).
 *       400:
 *         description: Datos inválidos (correo, nombre, teléfono, dirección, tipo, salario o permisos).
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       409:
 *         description: Ya existe un empleado registrado con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
// Solo un admin ya autenticado puede invitar a un nuevo empleado.
router.post("/send-invitation", validateAuthCookie(["admin"]), inviteEmployeeController.sendInvitation);

/**
 * @swagger
 * /auth/employees/invite/check-invitation:
 *   get:
 *     summary: Valida el token de una invitación de empleado
 *     description: Público (se valida por el token firmado que llega en la query, no por cookie de sesión — el invitado todavía no tiene cuenta). Devuelve los datos precargados (nombre, apellido, tipo) sin exponer el salario.
 *     tags: [Auth - Employees]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Token firmado incluido en el enlace del correo de invitación.
 *     responses:
 *       200:
 *         description: Token válido; devuelve email y personalInfo básica (name, lastname, type).
 *       400:
 *         description: Falta el token o el token no es válido.
 *       401:
 *         description: La invitación ya venció.
 *       500:
 *         description: Error interno del servidor.
 */
// check-invitation y accept-invitation los usa el INVITADO, que todavía no
// tiene sesión: se validan por el token firmado que llega en la propia
// petición, no por cookie.
router.get("/check-invitation", inviteEmployeeController.validateInvitation);

/**
 * @swagger
 * /auth/employees/invite/accept-invitation:
 *   post:
 *     summary: El empleado invitado acepta la invitación y crea su cuenta
 *     description: Público (autorizado por el token firmado de la invitación, no por cookie de sesión). Define la contraseña y, opcionalmente, sube una foto de perfil. Los datos personales y laborales vienen del token, no del body.
 *     tags: [Auth - Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string, example: "eyJhbGciOi..." }
 *               password: { type: string, example: "MiClave#123" }
 *               image: { type: string, format: binary, description: "Foto de perfil opcional." }
 *     responses:
 *       201:
 *         description: Cuenta de empleado creada correctamente; incluye hasPermissions y accessCodeSent.
 *       400:
 *         description: Contraseña que no cumple las reglas mínimas, o token inválido.
 *       401:
 *         description: La invitación ya venció.
 *       409:
 *         description: Ya existe un empleado registrado con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/accept-invitation", upload.single("image"), inviteEmployeeController.acceptInvitation);
export default router;
