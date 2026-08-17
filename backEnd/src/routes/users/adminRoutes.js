import express from "express";
import adminController from "../../controllers/users/adminController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import upload from "../../utils/cloudinaryConfig.js";
const router = express.Router();

// Todos los llamadores posibles ya son admins (no hay otro rol con acceso a
// /users/admins), así que no hace falta una verificación de ownership extra
// aparte de exigir el rol admin.
/**
 * @swagger
 * /users/admins:
 *   get:
 *     summary: Lista los administradores registrados
 *     description: Solo admin. Soporta filtros de búsqueda vía query string (mismos criterios que crudUtils.searchDocuments).
 *     tags: [Usuarios - Admins]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Arreglo de administradores.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/").get(validateAuthCookie(["admin"]), adminController.getAdmins);

/**
 * @swagger
 * /users/admins/{id}:
 *   patch:
 *     summary: Actualiza los datos de un administrador
 *     description: Solo admin. Permite actualizar nombre, apellido y/o foto de perfil.
 *     tags: [Usuarios - Admins]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del administrador a actualizar.
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Carlos" }
 *               lastname: { type: string, example: "Ramírez" }
 *               image: { type: string, format: binary, description: "Nueva foto de perfil opcional." }
 *     responses:
 *       200:
 *         description: Administrador actualizado; devuelve el documento actualizado (sin password).
 *       400:
 *         description: Nombre o apellido inválidos.
 *       401:
 *         description: No autenticado o rol distinto de admin.
 *       404:
 *         description: No se encontró el administrador solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/:id", validateAuthCookie(["admin"]), upload.single("image"), adminController.updateAdmin);

export default router;
