import express from "express";
import settingsController from "../../controllers/settings/settingsController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Todo el personal puede leer la configuración (el panel la necesita para
// saber, por ejemplo, cuál es el umbral de stock bajo)
router.get("/", validateAuthCookie(["admin", "employee"]), settingsController.getSettings);

// Pero solo el administrador puede modificarla
router.put("/", validateAuthCookie(["admin"]), settingsController.updateSettings);

export default router;
