import express from "express";
import notificationsController from "../../controllers/notifications/notificationsController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Todas las rutas exigen sesión: las notificaciones son información interna del negocio

// Listar las notificaciones del usuario y su contador de no leídas
router.get("/", validateAuthCookie(["admin", "employee"]), notificationsController.getNotifications);

// Marcar todas como leídas (va antes de "/:id/read" por claridad de lectura)
router.patch("/read-all", validateAuthCookie(["admin", "employee"]), notificationsController.markAllAsRead);

// Marcar una notificación puntual como leída
router.patch("/:id/read", validateAuthCookie(["admin", "employee"]), notificationsController.markAsRead);

// Borrar una notificación: solo el administrador
router.delete("/:id", validateAuthCookie(["admin"]), notificationsController.deleteNotification);

export default router;
