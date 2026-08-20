import express from "express";
import cartController from "../../controllers/orders/cartController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Los carritos traen datos personales del cliente (nombre, email) vía populate,
// así que listarlos/verlos/borrarlos es tarea del personal del local, no de
// cualquier cliente autenticado. Crear y actualizar (avanzar de estado, agregar
// productos) sí lo hacen meseros/cajeros/admin en el flujo normal de pedidos.
/**
 * @swagger
 * /orders/carts:
 *   get:
 *     summary: Lista todos los carritos
 *     description: Solo admin. Incluye datos personales del cliente y detalle de productos (combos, extras, bebidas) vía populate.
 *     tags: [Carritos]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Arreglo de carritos con customerId/table/detalles populados.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un carrito
 *     description: Empleado o admin. Calcula automáticamente el subtotal de cada detalle y el total general a partir de los combos/extras/bebidas reales. Dispara una notificación de "Nueva orden".
 *     tags: [Carritos]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [details]
 *             properties:
 *               customerId: { type: string, example: "665f1a2b3c4d5e6f7a8b9c01" }
 *               table: { type: string, example: "665f1a2b3c4d5e6f7a8b9c00" }
 *               status: { type: string, example: "pending" }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     combos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           comboId: { type: string, example: "665f1a2b3c4d5e6f7a8b9c10" }
 *                           quantity: { type: integer, example: 1 }
 *                     extras:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           extraId: { type: string, example: "665f1a2b3c4d5e6f7a8b9c20" }
 *                           quantity: { type: integer, example: 1 }
 *                           drinks:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 drinkId: { type: string, example: "665f1a2b3c4d5e6f7a8b9c30" }
 *     responses:
 *       201:
 *         description: Carrito creado, con subTotal/total calculados.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
  .get(validateAuthCookie(["admin", "employee"]), cartController.getAllCarts)
  .post(validateAuthCookie(["employee", "admin"]), cartController.insertCart);

/**
 * @swagger
 * /orders/carts/{id}:
 *   get:
 *     summary: Obtiene un carrito por ID
 *     description: Solo admin. Incluye datos personales del cliente y detalle de productos vía populate.
 *     tags: [Carritos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Carrito con customerId/table/detalles populados.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: Carrito no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   patch:
 *     summary: Actualiza un carrito
 *     description: Empleado o admin. Si se envía "details", recalcula subtotales y total desde cero. Si el estado cambia a "cooking" por primera vez, descuenta el inventario correspondiente (recetas de combos e ingredientes de extras) y puede devolver ingredientes insuficientes. Registra el cambio en statusHistory y dispara notificaciones.
 *     tags: [Carritos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId: { type: string, example: "665f1a2b3c4d5e6f7a8b9c01" }
 *               table: { type: string, example: "665f1a2b3c4d5e6f7a8b9c00" }
 *               status: { type: string, example: "cooking" }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     combos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           comboId: { type: string }
 *                           quantity: { type: integer }
 *                     extras:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           extraId: { type: string }
 *                           quantity: { type: integer }
 *     responses:
 *       200:
 *         description: "Carrito actualizado. Incluye insufficientIngredients (arreglo, vacío si no aplicó)."
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: Carrito no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un carrito
 *     description: Solo admin. Dispara una notificación de "Orden cancelada".
 *     tags: [Carritos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Carrito eliminado.
 *       401:
 *         description: No autenticado o rol sin permiso.
 *       404:
 *         description: Carrito no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
  .get(validateAuthCookie(["employee", "admin"]), cartController.getCartById)
  .patch(validateAuthCookie(["employee", "admin"]), cartController.updateCart)
  .delete(validateAuthCookie(["admin"]), cartController.deleteCart);

export default router;