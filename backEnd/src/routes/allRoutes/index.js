import { Router } from "express";
import cartRoutes from "../cartRoutes.js";
import extrasRouters from "../extrasRoutes.js";
import drinksRouters from "../extrasRoutes.js";
import saucerRouters from "../saucersRoutes.js";

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

//auth - customers
router.use("/auth/customers/register", registerCustomerRoutes);
//auth - employees
router.use("/auth/employees/register", registerEmployeeRoutes);
//auth - admins
router.use("/auth/admins/register", registerAdminRoutes);

export default router;