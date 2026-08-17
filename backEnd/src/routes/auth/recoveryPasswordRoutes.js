import express from "express";

import recoveryPasswordController from "../../controllers/auth/recoveryPasswordController.js";
import { authRateLimiter } from "../../middlewares/security/rateLimitMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /auth/recovery-password/request-code:
 *   post:
 *     summary: Solicita un código de recuperación de contraseña por correo
 *     description: Público. Envía un código al correo indicado si existe una cuenta (admin, empleado o cliente) asociada.
 *     tags: [Auth - Común]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "usuario@correo.com" }
 *     responses:
 *       200:
 *         description: Código enviado (o respuesta genérica, para no filtrar si el correo existe).
 *       400:
 *         description: Correo inválido o faltante.
 *       429:
 *         description: Demasiados intentos (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/request-code").post(authRateLimiter, recoveryPasswordController.requestCode);

/**
 * @swagger
 * /auth/recovery-password/verify-code:
 *   post:
 *     summary: Verifica el código de recuperación de contraseña
 *     description: Público. Confirma que el código enviado por correo es válido antes de permitir definir una nueva contraseña.
 *     tags: [Auth - Común]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, example: "usuario@correo.com" }
 *               code: { type: string, example: "A1B2C3" }
 *     responses:
 *       200:
 *         description: Código válido.
 *       400:
 *         description: Código inválido, vencido o datos faltantes.
 *       429:
 *         description: Demasiados intentos (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/verify-code").post(authRateLimiter, recoveryPasswordController.verifyCode);

/**
 * @swagger
 * /auth/recovery-password/new-password:
 *   post:
 *     summary: Define una nueva contraseña tras verificar el código de recuperación
 *     description: Público (el propio código ya verificado autoriza la operación, no se exige cookie de sesión).
 *     tags: [Auth - Común]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, example: "usuario@correo.com" }
 *               code: { type: string, example: "A1B2C3" }
 *               newPassword: { type: string, example: "NuevaClave#123" }
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Código inválido/vencido, contraseña que no cumple las reglas mínimas, o datos faltantes.
 *       429:
 *         description: Demasiados intentos (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/new-password").post(authRateLimiter, recoveryPasswordController.newPassword);

export default router;