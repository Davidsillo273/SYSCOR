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
import wompiRoutes from "../orders/wompiRoutes.js"
import tablesRoutes from "../tables/tablesRoutes.js"
import notificationsRoutes from "../notifications/notificationsRoutes.js";
import settingsRoutes from "../settings/settingsRoutes.js";


// Aquí importamos todas las rutas de cada módulo

//auth - customers
import loginCustomerRoutes from "../auth/customers/loginCustomerRoutes.js";
import registerCustomerRoutes from "../auth/customers/registerCustomerRoutes.js";
//auth - employees
import inviteEmployeeRoutes from "../auth/employees/inviteEmployeeRoutes.js";
import loginEmployeeRoutes from "../auth/employees/loginEmployeeRoutes.js";
//auth - admins
import inviteAdminRoutes from "../auth/admins/inviteAdminRoutes.js";
import loginAdminRoutes from "../auth/admins/loginAdminRoutes.js";

//auth - logout
import logoutRoutes from "../auth/logoutRoutes.js";
//auth - recovery password
import recoveryPasswordRoutes from "../auth/recoveryPasswordRoutes.js";
//auth - change password (con sesión activa)
import changePasswordRoutes from "../auth/changePasswordRoutes.js";

//Midleware de autenticación
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js"; 
import authMeRoutes from "../auth/authMeRoutes.js";

const router = Router();

//Nombres de los endpoints
router.use("/carts", cartRoutes);
router.use("/extras",extrasRouters);
router.use("/drinks", drinksRouters);
router.use("/saucers",saucerRouters);
router.use("/combos", combosRouters);
router.use("/inventory",inventoryRoutes);
router.use("/customers", customerRoutes);
router.use("/employees",employeeRoutes);
router.use("/admins", adminRoutes);
router.use("/tables", tablesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/settings", settingsRoutes);

//Wompi
router.use("/wompi", wompiRoutes);

//auth - customers
router.use("/auth/customers/register", registerCustomerRoutes);
router.use("/auth/customers/login", loginCustomerRoutes);
//auth - employees
router.use("/auth/employees/invite", inviteEmployeeRoutes);
router.use("/auth/employees/login", loginEmployeeRoutes);
//auth - admins
router.use("/auth/admins/invite", inviteAdminRoutes);
router.use("/auth/admins/login", loginAdminRoutes);

//auth - logout
router.use("/auth/logout", logoutRoutes);
//auth - recovery password
router.use("/auth/recoveryPassword", recoveryPasswordRoutes);
//auth - change password (con sesión activa)
router.use("/auth", changePasswordRoutes);
//auth - authMe
router.use("/auth", authMeRoutes)

export default router;
