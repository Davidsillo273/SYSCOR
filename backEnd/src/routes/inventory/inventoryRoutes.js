import express from "express";
import inventoryController from "../../controllers/inventory/inventoryController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// El inventario es información de trasastienda (insumos, stock, costos): no
// hay ninguna señal de que clientes o empleados sin más contexto la necesiten,
// así que todas las rutas quedan restringidas a admin.
// Obtener todos los productos e insertar uno nuevo (imagen opcional)
/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Obtiene los productos del inventario
 *     description: Solo admin. Devuelve el inventario, con filtros opcionales por pendientes de completar o por tipo de artículo.
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: pending
 *         schema: { type: string, example: "true" }
 *         description: Si es "true", filtra solo los insumos creados al vuelo que faltan por completar.
 *       - in: query
 *         name: itemType
 *         schema: { type: string, example: "producto" }
 *         description: Filtra por categoría principal, "producto" o "activo_fijo".
 *     responses:
 *       200:
 *         description: Arreglo de artículos de inventario.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 *   post:
 *     summary: Registra un nuevo artículo en el inventario
 *     description: Solo admin. Crea un producto (materia prima, descuenta stock por recetas) o un activo fijo (mobiliario/equipo), con imagen opcional. Notifica si el stock inicial ya está por debajo del mínimo (solo productos).
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, ubication, quantity, type, status]
 *             properties:
 *               name: { type: string, example: "Tomate" }
 *               price: { type: number, example: 0.8 }
 *               ubication: { type: string, example: "Bodega A" }
 *               quantity: { type: number, example: 50 }
 *               type: { type: string, example: "Verduras" }
 *               status: { type: string, example: "Disponible" }
 *               unit: { type: string, example: "kg", description: "Requerido si itemType es 'producto'" }
 *               itemType: { type: string, example: "producto", description: "'producto' o 'activo_fijo'" }
 *               condition: { type: string, example: "Bueno", description: "Requerido si itemType es 'activo_fijo'" }
 *               acquisitionDate: { type: string, example: "2026-01-15", description: "Solo aplica si itemType es 'activo_fijo'" }
 *               lowStockAlert: { type: number, example: 10, description: "Solo aplica si itemType es 'producto'" }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: "Insumo creado. Devuelve { title, message, newInventory }."
 *       400:
 *         description: Datos inválidos (nombre, tipo, precio, ubicación, cantidad, categoría, condición, estado, unidad o alerta de stock).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/")
    .get(validateAuthCookie(["admin"]), inventoryController.getAllInventory)
    .post(validateAuthCookie(["admin"]), upload.single("image"), inventoryController.insertInventory);

// Creación mínima (nombre + unidad) desde el builder de receta de bebidas/platillos/extras
/**
 * @swagger
 * /inventory/quick:
 *   post:
 *     summary: Crea un insumo mínimo (nombre + unidad)
 *     description: Solo admin. Crea un insumo "producto" mínimo desde el builder de receta de una bebida/platillo/extra. Nace marcado como pendiente hasta completarse desde Inventario.
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, unit]
 *             properties:
 *               name: { type: string, example: "Cilantro" }
 *               unit: { type: string, example: "kg" }
 *               type: { type: string, example: "Verduras", description: "Por defecto 'Otros' si se omite" }
 *     responses:
 *       201:
 *         description: "Insumo pendiente creado. Devuelve { message, newInventory }."
 *       400:
 *         description: Nombre inválido o unidad faltante.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/quick", validateAuthCookie(["admin"]), inventoryController.insertQuickInventory);

// Revisa si el stock actual alcanza para una receta, sin descontar nada todavía
/**
 * @swagger
 * /inventory/check-recipe-stock:
 *   post:
 *     summary: Revisa si el stock alcanza para una receta
 *     description: Solo admin. Verifica, sin descontar nada, si el stock actual de cada ingrediente de una receta alcanza para la cantidad declarada. Usado por Extras antes de confirmar la creación de un extra compuesto.
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipe:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tracked: { type: boolean, example: true }
 *                     inventoryId: { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *                     name: { type: string, example: "Tomate" }
 *                     quantity: { type: number, example: 2 }
 *                     unit: { type: string, example: "kg" }
 *     responses:
 *       200:
 *         description: "Resultado de la verificación, con un arreglo 'missing' de los ingredientes sin stock suficiente o inexistentes."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/check-recipe-stock", validateAuthCookie(["admin"]), inventoryController.checkRecipeStock);

// Revisa si ya existe un insumo con ese nombre (sugerencia, no bloqueo)
/**
 * @swagger
 * /inventory/check-name:
 *   get:
 *     summary: Revisa si ya existe un insumo con ese nombre
 *     description: Solo admin. Búsqueda insensible a mayúsculas; es solo una sugerencia, no bloquea la creación.
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         example: "Tomate"
 *     responses:
 *       200:
 *         description: "Resultado de la búsqueda, con 'existing' igual al insumo encontrado o null."
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/check-name", validateAuthCookie(["admin"]), inventoryController.checkName);

// Obtener un producto por ID, actualizarlo y eliminarlo
/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Obtiene un producto de inventario por ID
 *     description: Solo admin.
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artículo de inventario encontrado.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el insumo solicitado.
 *       500:
 *         description: Error interno del servidor.
 *   patch:
 *     summary: Actualiza un producto de inventario
 *     description: Solo admin. Actualiza los datos del artículo y opcionalmente reemplaza su imagen. Al completarse queda marcado como no pendiente. Puede disparar notificación de stock bajo y deshabilitar platillos dependientes (solo productos).
 *     tags: [Inventario]
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
 *             required: [name, price, ubication, quantity, type, status]
 *             properties:
 *               name: { type: string, example: "Tomate" }
 *               price: { type: number, example: 0.9 }
 *               ubication: { type: string, example: "Bodega A" }
 *               quantity: { type: number, example: 30 }
 *               type: { type: string, example: "Verduras" }
 *               status: { type: string, example: "Disponible" }
 *               unit: { type: string, example: "kg" }
 *               itemType: { type: string, example: "producto" }
 *               condition: { type: string, example: "Bueno" }
 *               acquisitionDate: { type: string, example: "2026-01-15" }
 *               lowStockAlert: { type: number, example: 10 }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: "Insumo actualizado. Devuelve { title, message, updatedInventory }."
 *       400:
 *         description: Datos inválidos (nombre, tipo, precio, ubicación, cantidad, categoría, condición, estado, unidad o alerta de stock).
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el insumo solicitado.
 *       500:
 *         description: Error interno del servidor.
 *   delete:
 *     summary: Elimina un producto de inventario
 *     description: Solo admin. Elimina el artículo y borra su imagen asociada de Cloudinary (si existe).
 *     tags: [Inventario]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Insumo eliminado correctamente.
 *       401:
 *         description: No autenticado o rol no autorizado.
 *       404:
 *         description: No se encontró el insumo solicitado.
 *       500:
 *         description: Error interno del servidor.
 */
router.route("/:id")
    .get(validateAuthCookie(["admin"]), inventoryController.getInventoryById)
    .patch(validateAuthCookie(["admin"]), upload.single("image"), inventoryController.updateInventory)
    .delete(validateAuthCookie(["admin"]), inventoryController.deleteInventory);

export default router;
