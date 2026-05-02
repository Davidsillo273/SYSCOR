import { Router } from "express";

// Aquí importamos todas las rutas de cada módulo
import adminRoutes from "../adminRoutes.js";

const router = Router();

// Nombres de los endpoints
router.use("/admins", adminRoutes);

export default router;