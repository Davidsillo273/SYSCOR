import { Router } from "express";
import cartController from "../controllers/cartController.js";

const router = Router();

// Definición de rutas para el carrito
router.get("/", cartController.getAllCarts);
router.get("/:id", cartController.getCartById);
router.post("/", cartController.insertCart);
router.put("/:id", cartController.updateCart);
router.delete("/:id", cartController.deleteCart);

export default router;