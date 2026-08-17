import { Router } from "express";
import authMeController from "../../controllers/auth/authMeController.js";
import {validateAuthCookie} from "../../middlewares/auth/authMiddleware.js"; 

const router = Router();

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtiene los datos del usuario con sesión activa
 *     description: Admin, empleado o cliente. Devuelve quién es el usuario dueño de la cookie de sesión actual (id, rol y datos de perfil).
 *     tags: [Auth - Común]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado (id, role, type si es empleado, email, name, lastname, image, y para empleados también personalInfo/workInfo/permissions).
 *       400:
 *         description: El rol de la sesión no es válido.
 *       401:
 *         description: No hay sesión activa o el usuario de la cookie ya no existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/me", validateAuthCookie(["admin", "employee", "customer"]), authMeController.getMe);

export default router;