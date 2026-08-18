import express from "express";
import drinksController from "../../controllers/menu/drinksController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /menu/drinks:
 *   get:
 *     summary: Obtiene todas las bebidas
 *     description: Solo admin. Devuelve todas las bebidas del menú sin importar su estado.
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de bebidas.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea una nueva bebida
 *     description: Solo admin. Crea una bebida (categoría "casa" con receta de inventario, o "tercero" con stock propio) con imagen opcional. Dispara notificación de stock bajo si aplica.
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, category]
 *             properties:
 *               name: { type: string, example: "Horchata" }
 *               price: { type: number, example: 2.5 }
 *               category: { type: string, example: "casa", description: "'casa' o 'tercero'" }
 *               subcategory: { type: string, example: "Aguas frescas" }
 *               description: { type: string, example: "Bebida tradicional de arroz" }
 *               quantity: { type: string, example: "50", description: "Solo aplica si category es 'tercero'" }
 *               status: { type: string, example: "disponible" }
 *               recipe: { type: string, example: "[{\"inventoryId\":\"64f...\",\"quantity\":1,\"unit\":\"l\"}]", description: "JSON stringificado, solo aplica si category es 'casa'" }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: "Bebida creada. Devuelve { title, message }."
 *       400:
 *         description: Datos inválidos (nombre, precio, categoría, cantidad, receta o estado).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(validateAuthCookie(["admin"]), drinksController.getAllDrinks)
  .post(validateAuthCookie(["admin"]), upload.single("image"), drinksController.insertDrink);

/**
 * @swagger
 * /menu/drinks/active:
 *   get:
 *     summary: Obtiene las bebidas activas
 *     description: Cliente o admin. Devuelve solo las bebidas con estado "activo".
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de bebidas activas.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/active", validateAuthCookie(["customer", "employee", "admin"]), drinksController.getActiveDrinks);

// Ranking de bebidas más vendidas
/**
 * @swagger
 * /menu/drinks/best-sellers:
 *   get:
 *     summary: Ranking de bebidas más vendidas
 *     description: Solo admin. Cuenta las bebidas vendidas anidadas dentro de extras en los carritos registrados.
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Cantidad máxima de bebidas a devolver.
 *     responses:
 *       200:
 *         description: "Arreglo de bebidas con su cantidad total vendida (totalSold), ordenado descendente."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/best-sellers", validateAuthCookie(["admin"]), drinksController.getBestSellers);

// Revisa si ya existe una bebida con ese nombre (sugerencia, no bloqueo)
/**
 * @swagger
 * /menu/drinks/check-name:
 *   get:
 *     summary: Revisa si ya existe una bebida con ese nombre
 *     description: Solo admin. Búsqueda insensible a mayúsculas; es solo una sugerencia, no bloquea la creación.
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         example: "Horchata"
 *     responses:
 *       200:
 *         description: "Resultado de la búsqueda, con 'existing' igual a la bebida encontrada o null."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/check-name", validateAuthCookie(["admin"]), drinksController.checkName);

/**
 * @swagger
 * /menu/drinks/{id}:
 *   patch:
 *     summary: Actualiza una bebida existente
 *     description: Solo admin. Actualiza los datos de la bebida y opcionalmente reemplaza su imagen. Dispara notificación de stock bajo si aplica.
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, category, status]
 *             properties:
 *               name: { type: string, example: "Horchata" }
 *               price: { type: number, example: 2.75 }
 *               category: { type: string, example: "casa" }
 *               subcategory: { type: string, example: "Aguas frescas" }
 *               description: { type: string, example: "Bebida tradicional de arroz" }
 *               quantity: { type: string, example: "50" }
 *               status: { type: string, example: "disponible" }
 *               recipe: { type: string, example: "[{\"inventoryId\":\"64f...\",\"quantity\":1,\"unit\":\"l\"}]" }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: "Bebida actualizada. Devuelve { title, message }."
 *       400:
 *         description: Datos inválidos (nombre, precio, categoría, cantidad, receta o estado).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró la bebida solicitada.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina una bebida
 *     description: Solo admin. Elimina la bebida del menú y borra su imagen asociada de Cloudinary (si existe).
 *     tags: [Menú - Bebidas]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bebida eliminada correctamente.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró la bebida solicitada.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/:id")
  .patch(validateAuthCookie(["admin"]), upload.single("image"), drinksController.updateDrink)
  .delete(validateAuthCookie(["admin"]), drinksController.deleteDrink);

export default router;
