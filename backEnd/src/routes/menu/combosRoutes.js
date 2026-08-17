import express from "express";
import combosController from "../../controllers/menu/combosController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Obtener todos los combos y crear uno nuevo (gestión del panel: solo admin)
/**
 * @swagger
 * /menu/combos:
 *   get:
 *     summary: Obtiene todos los combos
 *     description: Solo admin. Devuelve todos los combos (cualquier estado) con sus platillos y bebidas incluidos (populate).
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de combos.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo combo
 *     description: Solo admin. Crea un combo (fijo o selectivo) con sus platillos, política de bebidas e imagen opcional.
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, category, price, description]
 *             properties:
 *               name: { type: string, example: "Combo Taquero" }
 *               category: { type: string, example: "Tacos" }
 *               price: { type: number, example: 8.5 }
 *               description: { type: string, example: "Tres tacos con bebida a elegir" }
 *               status: { type: string, example: "disponible" }
 *               selective: { type: string, example: "false", description: "'true'/'false' como string (FormData)" }
 *               selectiveMaxPicks: { type: string, example: "2" }
 *               saucers: { type: string, example: "[{\"saucerId\":\"64f...\",\"quantity\":3}]", description: "JSON stringificado" }
 *               selectiveOptions: { type: string, example: "[{\"saucerId\":\"64f...\"}]", description: "JSON stringificado, solo si selective=true" }
 *               drinkPolicy: { type: string, example: "{\"drinkSetIds\":[\"64f...\"]}", description: "JSON stringificado" }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: "Combo creado. Devuelve { title, message, newCombo }."
 *       400:
 *         description: Datos inválidos (nombre, categoría, platillos, precio, descripción o estado).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(validateAuthCookie(["admin"]), combosController.getAllCombos)
    .post(validateAuthCookie(["admin"]), upload.single("image"), combosController.insertCombo);

// Obtener solo los combos activos (el menú público que ve el cliente)
/**
 * @swagger
 * /menu/combos/active:
 *   get:
 *     summary: Obtiene los combos activos
 *     description: Cliente o admin. Devuelve solo los combos con estado "disponible", con platillos y bebidas incluidos.
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de combos disponibles.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/active", validateAuthCookie(["customer", "admin"]), combosController.getActiveCombos);

// Ranking de combos más vendidos (panel de analítica: solo admin)
/**
 * @swagger
 * /menu/combos/best-sellers:
 *   get:
 *     summary: Ranking de combos más vendidos
 *     description: Solo admin. Cuenta las unidades pedidas en todos los carritos registrados y devuelve el top de combos.
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Cantidad máxima de combos a devolver.
 *     responses:
 *       200:
 *         description: "Arreglo de combos con su cantidad total vendida (totalSold), ordenado descendente."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/best-sellers", validateAuthCookie(["admin"]), combosController.getBestSellers);

// Revisa si ya existe un combo con ese nombre (sugerencia, no bloqueo)
/**
 * @swagger
 * /menu/combos/check-name:
 *   get:
 *     summary: Revisa si ya existe un combo con ese nombre
 *     description: Solo admin. Búsqueda insensible a mayúsculas; es solo una sugerencia, no bloquea la creación.
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         example: "Combo Taquero"
 *     responses:
 *       200:
 *         description: "Resultado de la búsqueda, con 'existing' igual al combo encontrado o null."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/check-name", validateAuthCookie(["admin"]), combosController.checkName);

// Obtener un combo por ID, actualizarlo y eliminarlo
/**
 * @swagger
 * /menu/combos/{id}:
 *   patch:
 *     summary: Actualiza un combo existente
 *     description: Solo admin. Actualiza datos, platillos/selectivos, política de bebidas, precio, estado y/o imagen del combo.
 *     tags: [Menú - Combos]
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
 *             required: [name, category, price, description, status]
 *             properties:
 *               name: { type: string, example: "Combo Taquero" }
 *               category: { type: string, example: "Tacos" }
 *               price: { type: number, example: 9 }
 *               description: { type: string, example: "Tres tacos con bebida a elegir" }
 *               status: { type: string, example: "disponible" }
 *               selective: { type: string, example: "false" }
 *               selectiveMaxPicks: { type: string, example: "2" }
 *               saucers: { type: string, example: "[{\"saucerId\":\"64f...\",\"quantity\":3}]" }
 *               selectiveOptions: { type: string, example: "[{\"saucerId\":\"64f...\"}]" }
 *               drinkPolicy: { type: string, example: "{\"drinkSetIds\":[\"64f...\"]}" }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: "Combo actualizado. Devuelve { title, message, updatedCombo }."
 *       400:
 *         description: Datos inválidos (nombre, categoría, platillos, precio, descripción o estado).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el combo solicitado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un combo
 *     description: Solo admin. Elimina el combo y borra su imagen asociada de Cloudinary (si existe).
 *     tags: [Menú - Combos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Combo eliminado correctamente.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el combo solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .patch(validateAuthCookie(["admin"]), upload.single("image"), combosController.updateCombo)
    .delete(validateAuthCookie(["admin"]), combosController.deleteCombo);

export default router;
