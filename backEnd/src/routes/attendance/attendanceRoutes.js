import { Router } from "express";
import attendanceController from "../../controllers/attendance/attendanceController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Marca la entrada del empleado autenticado
 *     description: Empleado. Solo una vez por día calendario; calcula si llegó temprano, a tiempo o tarde comparando contra su horario asignado.
 *     tags: [Asistencia]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Entrada registrada.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: No se encontró la ficha del empleado.
 *       409:
 *         description: Ya se registró la entrada de hoy.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/check-in", validateAuthCookie(["employee"]), attendanceController.checkIn);

/**
 * @swagger
 * /attendance/check-out:
 *   post:
 *     summary: Marca la salida del empleado autenticado
 *     description: Empleado. Cierra la asistencia abierta de hoy.
 *     tags: [Asistencia]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Salida registrada.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: No se ha marcado la entrada de hoy.
 *       409:
 *         description: Ya se registró la salida de hoy.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/check-out", validateAuthCookie(["employee"]), attendanceController.checkOut);

/**
 * @swagger
 * /attendance/me:
 *   get:
 *     summary: Historial de asistencia del empleado autenticado
 *     description: Empleado. Paginado, más reciente primero.
 *     tags: [Asistencia]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15 }
 *     responses:
 *       200:
 *         description: Historial paginado.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/me", validateAuthCookie(["employee"]), attendanceController.getMyAttendance);

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     summary: Estado de asistencia de hoy del empleado autenticado
 *     description: Empleado. Devuelve el registro de hoy o null si aún no marca entrada.
 *     tags: [Asistencia]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Registro de hoy (o null).
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/today", validateAuthCookie(["employee"]), attendanceController.getTodayStatus);

export default router;
