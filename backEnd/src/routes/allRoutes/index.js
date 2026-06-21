import { Router } from "express";
import cartRoutes from "../orders/cartRoutes.js";
import extrasRouters from "../menu/extrasRoutes.js";
import drinksRouters from "../menu/drinksRoutes.js";
import saucerRouters from "../menu/saucersRoutes.js";
import combosRouters from "../menu/combosRoutes.js";
import inventoryRoutes from "../inventory/inventoryRoutes.js";
import customerRoutes from "../users/customerRoutes.js";
import employeeRoutes from "../users/employeeRoutes.js";
import adminRoutes from "../users/adminRoutes.js";
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

//Midleware de autenticación
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

//Nombres de los endpoints
router.use("/carts", validateAuthCookie(["customer"]), cartRoutes);
router.use("/extras", extrasRouters);
router.use("/drinks", drinksRouters);
router.use("/saucers", saucerRouters);
router.use("/combos", combosRouters);
router.use("/inventory", inventoryRoutes);
router.use("/customers", customerRoutes);
router.use("/employees", employeeRoutes);
router.use("/admins", validateAuthCookie(["admin"]), adminRoutes);

//auth - customers
router.use("/auth/customers/register", validateAuthCookie(["customer"]), registerCustomerRoutes);
router.use("/auth/customers/login", loginCustomerRoutes);
//auth - employees
router.use("/auth/employees/register", validateAuthCookie(["employee"]), registerEmployeeRoutes);
router.use("/auth/employees/login", loginEmployeeRoutes);
//auth - admins
router.use("/auth/admins/register", validateAuthCookie(["admin"]), registerAdminRoutes);
router.use("/auth/admins/login", loginAdminRoutes);

//auth - logout
router.use("/auth/logout", logoutRoutes);
//auth - recovery password
router.use("/auth/recoveryPassword", recoveryPasswordRoutes);

export default router;

