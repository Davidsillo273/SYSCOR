import express from "express";

import loginEmployeeController from "../../../controllers/auth/employees/loginEmployeeController.js";
import { authRateLimiter } from "../../../middlewares/security/rateLimitMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /auth/employees/login:
 *   post:
 *     summary: Inicia sesión como empleado (email y contraseña)
 *     description: Público. Valida email y contraseña y, si son correctos, deja una cookie httpOnly (authCookie) con la sesión.
 *     tags: [Auth - Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "empleado@syscor.com" }
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
router.route("/").post(authRateLimiter, loginEmployeeController.loginEmployee);

/**
 * @swagger
 * /auth/employees/login/verify-access-code:
 *   post:
 *     summary: Verifica que un código de acceso de empleado exista y esté activo
 *     description: Público. Primer paso del login alternativo por código (no autentica todavía, solo confirma el código).
 *     tags: [Auth - Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "AB12CD" }
 *     responses:
 *       200:
 *         description: Código válido. Devuelve el nombre del empleado para precargar el formulario.
 *       400:
 *         description: Falta el código.
 *       404:
 *         description: El código de acceso no es válido.
 *       429:
 *         description: Demasiados intentos (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/verify-access-code", authRateLimiter, loginEmployeeController.verifyAccessCode);

/**
 * @swagger
 * /auth/employees/login/login-with-code:
 *   post:
 *     summary: Inicia sesión como empleado usando código de acceso + contraseña
 *     description: Público. Segundo paso del login alternativo por código; si son correctos, deja la cookie authCookie.
 *     tags: [Auth - Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, password]
 *             properties:
 *               code: { type: string, example: "AB12CD" }
 *               password: { type: string, example: "MiClave#123" }
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente (cookie authCookie establecida).
 *       400:
 *         description: Falta el código o la contraseña.
 *       401:
 *         description: Código o contraseña incorrectos.
 *       429:
 *         description: Demasiados intentos (rate limit de auth).
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/login-with-code", authRateLimiter, loginEmployeeController.loginWithAccessCode);

export default router;