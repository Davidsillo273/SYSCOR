import { Router } from "express";
import cartRoutes from "../cartRoutes.js";

// Aquí importamos todas las rutas de cada módulo

const router = Router();

// Nombres de los endpoints
router.use("/carts", cartRoutes);

export default router;