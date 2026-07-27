import express from "express";
import inventoryController from "../../controllers/inventory/inventoryController.js";

const router = express.Router();

// Obtener todos los productos e insertar uno nuevo
router.route("/")
    .get(inventoryController.getAllInventory)
    .post(inventoryController.insertInventory);

// Creación mínima (nombre + unidad) desde el builder de receta de bebidas
router.post("/quick", inventoryController.insertQuickInventory);

// Obtener un producto por ID, actualizarlo y eliminarlo
router.route("/:id")
    .get(inventoryController.getInventoryById)
    .put(inventoryController.updateInventory)
    .delete(inventoryController.deleteInventory);

export default router;