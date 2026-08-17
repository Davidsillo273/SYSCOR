import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteAdminController from "../../../controllers/auth/admins/inviteAdminController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

/**
 * @swagger
 * /auth/admins/invite/send-invitation:
 *   post:
 *     summary: Invita a una persona a convertirse en administrador
 *     description: Solo admin. Envía un correo con un enlace de invitación firmado; no crea ningún documento en la base de datos hasta que el invitado acepte.
 *     tags: [Auth - Admins]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastname]
 *             properties:
 *               email: { type: string, example: "nuevo.admin@correo.com" }
 *               name: { type: string, example: "Carlos" }
 *               lastname: { type: string, example: "Ramírez" }
 *     responses:
 *       200:
 *         description: Invitación enviada correctamente al correo indicado.
 *       400:
 *         description: Correo, nombre o apellido inválidos.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       409:
 *         description: Ya existe un administrador registrado con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
// Solo un admin ya autenticado puede invitar a otro admin. El controller
// (inviteAdminController.sendInvitation) ya asume que esta validación existe.
router.post("/send-invitation", validateAuthCookie(["admin"]), inviteAdminController.sendInvitation);

/**
 * @swagger
 * /auth/admins/invite/check-invitation:
 *   get:
 *     summary: Valida el token de una invitación de administrador
 *     description: Público (se valida por el token firmado que llega en la query, no por cookie de sesión — el invitado todavía no tiene cuenta). Devuelve los datos precargados (email, name, lastname).
 *     tags: [Auth - Admins]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Token firmado incluido en el enlace del correo de invitación.
 *     responses:
 *       200:
 *         description: Token válido; devuelve email y personalInfo (name, lastname).
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
router.get("/check-invitation", inviteAdminController.validateInvitation);

/**
 * @swagger
 * /auth/admins/invite/accept-invitation:
 *   post:
 *     summary: El administrador invitado acepta la invitación y crea su cuenta
 *     description: Público (autorizado por el token firmado de la invitación, no por cookie de sesión). Define la contraseña y, opcionalmente, sube una foto de perfil. Nombre y apellido vienen del token, no del body.
 *     tags: [Auth - Admins]
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
 *         description: Cuenta de administrador creada correctamente.
 *       400:
 *         description: Contraseña que no cumple las reglas mínimas, o token inválido.
 *       401:
 *         description: La invitación ya venció.
 *       409:
 *         description: Ya existe un administrador registrado con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/accept-invitation", upload.single("image"), inviteAdminController.acceptInvitation);

export default router;
