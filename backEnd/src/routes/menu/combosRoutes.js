import express from "express";
import combosController from "../../controllers/menu/combosController.js";
import upload from "../../utils/cloudinaryConfig.js";

const router = express.Router();

// Obtener todos los combos y crear uno nuevo
router.route("/")
    .get(combosController.getAllCombos)
    .post(upload.single("image"), combosController.insertCombo);

// Obtener un combo por ID, actualizarlo y eliminarlo
router.route("/:id")
    .get(combosController.getComboById)
    .put(upload.single("image"), combosController.updateCombo)
    .delete(combosController.deleteCombo);

export default router;