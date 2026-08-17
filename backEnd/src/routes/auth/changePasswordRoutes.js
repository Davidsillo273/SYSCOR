import { Router } from "express";
import changePasswordController from "../../controllers/auth/changePasswordController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /auth/update-password:
 *   patch:
 *     summary: Cambia la contraseña del usuario con sesión activa
 *     description: Admin, empleado o cliente. Requiere la contraseña actual como prueba de identidad; la nueva contraseña debe cumplir las reglas mínimas del sistema.
 *     tags: [Auth - Común]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: "MiClave#123" }
 *               newPassword: { type: string, example: "NuevaClave#456" }
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Falta la contraseña actual, la nueva no cumple las reglas mínimas, o es igual a la actual.
 *       401:
 *         description: Sesión inválida o la contraseña actual no es correcta.
 *       500:
 *         description: Error interno del servidor.
 */
// Cualquier usuario con sesión activa puede cambiar su propia contraseña
router.patch(
  "/update-password",
  validateAuthCookie(["admin", "employee", "customer"]),
  changePasswordController.changePassword
);

export default router;
