import express from "express";
import logoutController from "../../controllers/auth/logoutController.js";

const router = express.Router();

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cierra la sesión activa
 *     description: Público (funciona con o sin cookie presente). Borra la cookie httpOnly authCookie del navegador.
 *     tags: [Auth - Común]
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/").post(logoutController.logout);

export default router;