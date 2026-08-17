import { Router } from "express";
import invoiceController from "../../controllers/orders/invoiceController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Lista el historial de facturación
 *     description: Empleado o admin. Los registros no se crean manualmente, se generan automáticamente cuando un pedido pasa a estado "delivered".
 *     tags: [Facturación]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: orderType
 *         schema: { type: string, enum: [local, online] }
 *         description: Filtra por tipo de pedido.
 *     responses:
 *       200:
 *         description: Arreglo de facturas ordenadas por fecha de emisión descendente.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/", validateAuthCookie(["employee", "admin"]), invoiceController.getInvoices);

/**
 * @swagger
 * /invoices/analytics:
 *   get:
 *     summary: Métricas de ventas para el Dashboard
 *     description: Empleado o admin. Calcula ventas de hoy y ayer, tendencia de los últimos 14 días, ventas por tipo de pedido, top 5 productos más vendidos, ticket promedio del mes, total del mes y el conteo de pedidos operativos aún no facturados.
 *     tags: [Facturación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Objeto con today, yesterday, last14Days, byOrderType, topItems, avgTicket, monthTotal y pendingOrdersCount."
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/analytics", validateAuthCookie(["employee", "admin"]), invoiceController.getAnalytics);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Elimina un registro de facturación
 *     description: Solo admin. Uso excepcional para corregir errores de facturación (ej. una venta duplicada); no forma parte del flujo normal.
 *     tags: [Facturación]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Registro eliminado.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: Registro de facturación no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/:id", validateAuthCookie(["admin"]), invoiceController.deleteInvoice);

export default router;
