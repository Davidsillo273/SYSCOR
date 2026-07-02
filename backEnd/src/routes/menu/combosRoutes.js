import express from "express";
import combosController from "../../controllers/menu/combosController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Obtener todos los combos y crear uno nuevo
router.route("/")
    .get(combosController.getAllCombos)
    .post(upload.single("image"), combosController.insertCombo);

// Obtener solo los combos activos
router.get("/active", validateAuthCookie(["customer", "admin"]), combosController.getActiveCombos);

// Obtener un combo por ID, actualizarlo y eliminarlo
router.route("/:id")
    .put(upload.single("image"), combosController.updateCombo)
    .delete(combosController.deleteCombo);

export default router;