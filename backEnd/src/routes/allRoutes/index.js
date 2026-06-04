import { Router } from "express";
import extrasRoutes from "../../routes/extrasRoutes.js";
import drinksRoutes from "../../routes/drinksRoutes.js"
import saucersRoutes from "../../routes/saucersRoutes.js"

// Aquí importamos todas las rutas de cada módulo

const router = Router();

// Nombres de los endpoints
router.use("/extras", extrasRoutes);
router.use("/drinks", drinksRoutes);
router.use("/saucers", saucersRoutes);

export default router;