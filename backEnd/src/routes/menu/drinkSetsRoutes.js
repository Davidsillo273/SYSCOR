import express from "express";
import drinkSetsController from "../../controllers/menu/drinkSetsController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Los conjuntos de bebidas son piezas para armar combos desde el panel de
// administración: no hay ninguna pantalla de cliente/empleado que los use
// directamente, así que todo queda restringido a admin.
/**
 * @swagger
 * /menu/drink-sets:
 *   get:
 *     summary: Obtiene todos los conjuntos de bebidas
 *     description: Solo admin. Devuelve todos los conjuntos de bebidas (cualquier estado), con las bebidas incluidas (populate).
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de conjuntos de bebidas.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo conjunto de bebidas
 *     description: Solo admin. Crea un conjunto reutilizable de bebidas para usar al armar combos.
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, drinkIds]
 *             properties:
 *               name: { type: string, example: "Refrescos clásicos" }
 *               drinkIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["64f1a2b3c4d5e6f7a8b9c0d1", "64f1a2b3c4d5e6f7a8b9c0d2"]
 *     responses:
 *       201:
 *         description: "Conjunto creado. Devuelve { title, message, newSet }."
 *       400:
 *         description: Nombre inválido o falta seleccionar al menos una bebida.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(validateAuthCookie(["admin"]), drinkSetsController.getAllDrinkSets)
  .post(validateAuthCookie(["admin"]), drinkSetsController.insertDrinkSet);

// Solo los activos, usados al armar un combo
/**
 * @swagger
 * /menu/drink-sets/active:
 *   get:
 *     summary: Obtiene los conjuntos de bebidas activos
 *     description: Solo admin. Devuelve solo los conjuntos con estado "activo", usados al armar un combo.
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de conjuntos de bebidas activos.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/active", validateAuthCookie(["admin"]), drinkSetsController.getActiveDrinkSets);

/**
 * @swagger
 * /menu/drink-sets/check-name:
 *   get:
 *     summary: Revisa si ya existe un conjunto de bebidas con ese nombre
 *     description: Solo admin. Búsqueda insensible a mayúsculas; es solo una sugerencia, no bloquea la creación.
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         example: "Refrescos clásicos"
 *     responses:
 *       200:
 *         description: "Resultado de la búsqueda, con 'existing' igual al conjunto encontrado o null."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/check-name", validateAuthCookie(["admin"]), drinkSetsController.checkName);

// Deshabilitar/habilitar un conjunto (nunca se elimina)
/**
 * @swagger
 * /menu/drink-sets/{id}/toggle-status:
 *   patch:
 *     summary: Alterna el estado activo/inactivo de un conjunto de bebidas
 *     description: Solo admin. Cambia el estado entre "activo" e "inactivo" sin tocar nombre ni bebidas. Los conjuntos nunca se eliminan, solo se deshabilitan.
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Estado actualizado. Devuelve { title, message, updatedSet }."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el conjunto de bebidas solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/:id/toggle-status", validateAuthCookie(["admin"]), drinkSetsController.toggleDrinkSetStatus);

/**
 * @swagger
 * /menu/drink-sets/{id}:
 *   patch:
 *     summary: Actualiza un conjunto de bebidas
 *     description: Solo admin. Actualiza nombre, bebidas incluidas y opcionalmente el estado del conjunto.
 *     tags: [Menú - Conjuntos de bebidas]
 *     security: [{ cookieAuth: [] }]
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
 *             required: [name, drinkIds]
 *             properties:
 *               name: { type: string, example: "Refrescos clásicos" }
 *               drinkIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["64f1a2b3c4d5e6f7a8b9c0d1", "64f1a2b3c4d5e6f7a8b9c0d2"]
 *               status: { type: string, example: "activo", description: "'activo' o 'inactivo'" }
 *     responses:
 *       200:
 *         description: "Conjunto actualizado. Devuelve { title, message, updatedSet }."
 *       400:
 *         description: Nombre inválido o falta seleccionar al menos una bebida.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el conjunto de bebidas solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id").patch(validateAuthCookie(["admin"]), drinkSetsController.updateDrinkSet);

export default router;
