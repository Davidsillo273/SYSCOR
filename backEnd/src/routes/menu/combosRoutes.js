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

// Ranking de combos más vendidos
router.get("/best-sellers", combosController.getBestSellers);

// Revisa si ya existe un combo con ese nombre (sugerencia, no bloqueo)
router.get("/check-name", combosController.checkName);

// Obtener un combo por ID, actualizarlo y eliminarlo
router.route("/:id")
    .patch(upload.single("image"), combosController.updateCombo)
    .delete(combosController.deleteCombo);

export default router;