import { Router } from "express";
import cartRoutes from "../cartRoutes.js";
import extrasRouters from "../extrasRoutes.js";
import drinksRouters from "../drinksRoutes.js";
import saucerRouters from "../saucersRoutes.js";
import combosRouters from "../combosRoutes.js";
import inventoryRoutes from "../inventoryRoutes.js";
// Aquí importamos todas las rutas de cada módulo

//auth - customers
import registerCustomerRoutes from "../auth/customers/registerCustomerRoutes.js";
//auth - employees
import registerEmployeeRoutes from "../auth/employees/registerEmployeeRoutes.js";
//auth - admins
import registerAdminRoutes from "../auth/admins/registerAdminRoutes.js";

const router = Router();

//Nombres de los endpoints
router.use("/carts", cartRoutes);
router.use("/extras", extrasRouters);
router.use("/drinks", drinksRouters);
router.use("/saucers", saucerRouters);
router.use("/combos", combosRouters);
router.use("/inventory", inventoryRoutes);

//auth - customers
router.use("/auth/customers/register", registerCustomerRoutes);
//auth - employees
router.use("/auth/employees/register", registerEmployeeRoutes);
//auth - admins
router.use("/auth/admins/register", registerAdminRoutes);

export default router;