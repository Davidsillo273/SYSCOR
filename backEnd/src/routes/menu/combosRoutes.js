import express from "express";
import combosController from "../../controllers/menu/combosController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Obtener todos los combos y crear uno nuevo
router.route("/")
    .get(validateAuthCookie(["admin"]), combosController.getAllCombos)
    .post(validateAuthCookie(["admin"]), upload.single("image"), combosController.insertCombo);

// Obtener solo los combos activos
router.get("/active", validateAuthCookie(["customer", "admin"]), combosController.getActiveCombos);

// Obtener un combo por ID, actualizarlo y eliminarlo
router.route("/:id")
    .put(validateAuthCookie(["admin"]), upload.single("image"), combosController.updateCombo)
    .delete(validateAuthCookie(["admin"]), combosController.deleteCombo);

export default router;