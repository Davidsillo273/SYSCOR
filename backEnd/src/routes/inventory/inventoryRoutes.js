import express from "express";
import inventoryController from "../../controllers/inventory/inventoryController.js";
import upload from "../../utils/cloudinaryConfig.js";

const router = express.Router();

// Obtener todos los productos e insertar uno nuevo (imagen opcional)
router.route("/")
    .get(inventoryController.getAllInventory)
    .post(upload.single("image"), inventoryController.insertInventory);

// Creación mínima (nombre + unidad) desde el builder de receta de bebidas/platillos/extras
router.post("/quick", inventoryController.insertQuickInventory);

// Revisa si el stock actual alcanza para una receta, sin descontar nada todavía
router.post("/check-recipe-stock", inventoryController.checkRecipeStock);

// Revisa si ya existe un insumo con ese nombre (sugerencia, no bloqueo)
router.get("/check-name", inventoryController.checkName);

// Obtener un producto por ID, actualizarlo y eliminarlo
router.route("/:id")
    .get(inventoryController.getInventoryById)
    .patch(upload.single("image"), inventoryController.updateInventory)
    .delete(inventoryController.deleteInventory);

export default router;
