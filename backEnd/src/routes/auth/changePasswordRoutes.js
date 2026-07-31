import { Router } from "express";
import changePasswordController from "../../controllers/auth/changePasswordController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

// Cualquier usuario con sesión activa puede cambiar su propia contraseña
router.patch(
  "/update-password",
  validateAuthCookie(["admin", "employee", "customer"]),
  changePasswordController.changePassword
);

export default router;
