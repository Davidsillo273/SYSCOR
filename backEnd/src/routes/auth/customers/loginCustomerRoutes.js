import express from "express";

import loginCustomerController from "../../../controllers/auth/customers/loginCustomerController.js";
import { authRateLimiter } from "../../../middlewares/security/rateLimitMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /auth/customers/login:
 *   post:
 *     summary: Inicia sesión como cliente
 *     description: Público. Valida email y contraseña y, si son correctos, deja una cookie httpOnly (authCookie) con la sesión.
 *     tags: [Auth - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "cliente@correo.com" }
 *               password: { type: string, example: "MiClave#123" }
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente (cookie authCookie establecida).
 *       400:
 *         description: Credenciales inválidas o datos faltantes.
 *       401:
 *         description: Contraseña incorrecta o cuenta no verificada/bloqueada.
 *       429:
 *         description: Demasiados intentos de inicio de sesión (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
// Límite estricto de intentos para dificultar ataques de fuerza bruta sobre contraseñas
router.route("/").post(authRateLimiter, loginCustomerController.loginCustomer);

export default router;