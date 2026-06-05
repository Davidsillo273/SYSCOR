import { Router } from "express";
import cartRoutes from "../cartRoutes.js";
import extrasRouters from "../extrasRoutes.js";
import drinksRouters from "../drinksRoutes.js";
import saucerRouters from "../saucersRoutes.js";
import combosRouters from "../combosRoutes.js";
import inventoryRoutes from "../inventoryRoutes.js";
// Aquí importamos todas las rutas de cada módulo

const router = Router();

// Nombres de los endpoints
router.use("/carts", cartRoutes);
router.use("/extras", extrasRouters);
router.use("/drinks", drinksRouters);
router.use("/saucers", saucerRouters);
router.use("/combos", combosRouters);
router.use("/inventory", inventoryRoutes);

export default router;