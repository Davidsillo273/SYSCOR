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
import loginCustomerRoutes from "../auth/customers/loginCustomerRoutes.js";
//auth - employees
import registerEmployeeRoutes from "../auth/employees/registerEmployeeRoutes.js";
import loginEmployeeRoutes from "../auth/employees/loginEmployeeRoutes.js";
//auth - admins
import registerAdminRoutes from "../auth/admins/registerAdminRoutes.js";
import loginAdminRoutes from "../auth/admins/loginAdminRoutes.js";

//auth - logout
import logoutRoutes from "../auth/logoutRoutes.js";
//auth - recovery password
import recoveryPasswordRoutes from "../auth/recoveryPasswordRoutes.js";

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
router.use("/auth/customers/login", loginCustomerRoutes);
//auth - employees
router.use("/auth/employees/register", registerEmployeeRoutes);
router.use("/auth/employees/login", loginEmployeeRoutes);
//auth - admins
router.use("/auth/admins/register", registerAdminRoutes);
router.use("/auth/admins/login", loginAdminRoutes);

//auth - logout
router.use("/auth/logout", logoutRoutes);
//auth - recovery password
router.use("/auth/recoveryPassword", recoveryPasswordRoutes);

export default router;

