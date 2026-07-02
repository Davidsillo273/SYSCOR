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

router
  .route("/:id")
  .put(upload.single("image"), drinksController.updateDrink)
  .delete(drinksController.deleteDrink);

export default router;