import express from "express";
import extrasController from "../../controllers/menu/extrasController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /menu/extras:
 *   get:
 *     summary: Obtiene todos los extras
 *     description: Solo admin. Devuelve todos los complementos (extras) del menú, con sus ingredientes de inventario poblados (nombre y unidad).
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de extras.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Crea un nuevo extra
 *     description: Solo admin. Crea un complemento simple o compuesto (con receta de ingredientes de inventario) e imagen.
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, status, image]
 *             properties:
 *               name: { type: string, example: "Guacamole" }
 *               price: { type: number, example: 1.5 }
 *               status: { type: string, example: "DISPONIBLE" }
 *               category: { type: string, example: "Adicional" }
 *               isCompound: { type: string, example: "true", description: "'true'/'false' como string (FormData)" }
 *               ingredients: { type: string, example: "[{\"ingredientId\":\"64f...\",\"quantity\":1,\"unit\":\"kg\"}]", description: "JSON stringificado, solo si isCompound=true" }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: "Extra creado. Devuelve { title, message }."
 *       400:
 *         description: Datos inválidos (nombre, precio, estado, imagen o ingredientes).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/")
  .get(validateAuthCookie(["admin", "employee"]), extrasController.getExtras)
  .post(validateAuthCookie(["admin", "employee"]), upload.single("image"), extrasController.insertExtras);

/**
 * @swagger
 * /menu/extras/active:
 *   get:
 *     summary: Obtiene los extras activos
 *     description: Cliente o admin. Devuelve solo los extras con estado "DISPONIBLE".
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Arreglo de extras disponibles.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/active", validateAuthCookie(["customer", "admin", "employee"]), extrasController.getActiveExtras);

// Ranking de extras más pedidos
/**
 * @swagger
 * /menu/extras/best-sellers:
 *   get:
 *     summary: Ranking de extras más pedidos
 *     description: Solo admin. Cuenta las unidades pedidas en todos los carritos registrados y devuelve el top de extras.
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Cantidad máxima de extras a devolver.
 *     responses:
 *       200:
 *         description: "Arreglo de extras con su cantidad total vendida (totalSold), ordenado descendente."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/best-sellers", validateAuthCookie(["admin"]), extrasController.getBestSellers);

// Revisa si ya existe un extra con ese nombre (sugerencia, no bloqueo)
/**
 * @swagger
 * /menu/extras/check-name:
 *   get:
 *     summary: Revisa si ya existe un extra con ese nombre
 *     description: Solo admin. Búsqueda insensible a mayúsculas; es solo una sugerencia, no bloquea la creación.
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         example: "Guacamole"
 *     responses:
 *       200:
 *         description: "Resultado de la búsqueda, con 'existing' igual al extra encontrado o null."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/check-name", validateAuthCookie(["admin"]), extrasController.checkName);

/**
 * @swagger
 * /menu/extras/{id}:
 *   patch:
 *     summary: Actualiza un extra existente
 *     description: Solo admin. Actualiza los datos del extra (por ejemplo el precio) y opcionalmente reemplaza su imagen.
 *     tags: [Menú - Extras]
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
 *             required: [name, price, status]
 *             properties:
 *               name: { type: string, example: "Guacamole" }
 *               price: { type: number, example: 1.75 }
 *               status: { type: string, example: "DISPONIBLE" }
 *               category: { type: string, example: "Adicional" }
 *               isCompound: { type: string, example: "true" }
 *               ingredients: { type: string, example: "[{\"ingredientId\":\"64f...\",\"quantity\":1,\"unit\":\"kg\"}]" }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: "Extra actualizado. Devuelve { title, message }."
 *       400:
 *         description: Datos inválidos (nombre, precio, estado o ingredientes).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el extra solicitado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un extra
 *     description: Solo admin. Elimina el complemento del menú y borra su imagen asociada de Cloudinary (si existe).
 *     tags: [Menú - Extras]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Extra eliminado correctamente.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el extra solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router
  .route("/:id")
  .patch(validateAuthCookie(["admin"]), upload.single("image"), extrasController.updateExtra)
  .delete(validateAuthCookie(["admin"]), extrasController.deleteExtra);

export default router;
