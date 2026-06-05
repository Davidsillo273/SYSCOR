import { Router } from "express";
import cartRoutes from "../cartRoutes.js";
import extrasRouters from "../extrasRoutes.js";
import drinksRouters from "../extrasRoutes.js";
import saucerRouters from "../saucersRoutes.js";
// Aquí importamos todas las rutas de cada módulo

const router = Router();

// Nombres de los endpoints
router.use("/carts", cartRoutes);
router.use("/extras", extrasRouters);
router.use("/drinks", drinksRouters);
router.use("/saucers", saucerRouters);


export default router;