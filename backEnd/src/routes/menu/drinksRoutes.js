import express from "express";
import drinksController from "../../controllers/menu/drinksController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(drinksController.getAllDrinks)
  .post(upload.single("image"), drinksController.insertDrink);

router.get("/active", validateAuthCookie(["customer", "admin"]), drinksController.getActiveDrinks);

// Ranking de bebidas más vendidas
router.get("/best-sellers", drinksController.getBestSellers);

// Revisa si ya existe una bebida con ese nombre (sugerencia, no bloqueo)
router.get("/check-name", drinksController.checkName);

router
  .route("/:id")
  .patch(upload.single("image"), drinksController.updateDrink)
  .delete(drinksController.deleteDrink);

export default router;