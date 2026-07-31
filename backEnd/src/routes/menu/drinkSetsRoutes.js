import express from "express";
import drinkSetsController from "../../controllers/menu/drinkSetsController.js";

const router = express.Router();

router
  .route("/")
  .get(drinkSetsController.getAllDrinkSets)
  .post(drinkSetsController.insertDrinkSet);

// Solo los activos, usados al armar un combo
router.get("/active", drinkSetsController.getActiveDrinkSets);

router.get("/check-name", drinkSetsController.checkName);

// Deshabilitar/habilitar un conjunto (nunca se elimina)
router.patch("/:id/toggle-status", drinkSetsController.toggleDrinkSetStatus);

router.route("/:id").patch(drinkSetsController.updateDrinkSet);

export default router;
