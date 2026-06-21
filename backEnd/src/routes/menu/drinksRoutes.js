import express from "express";
import drinksController from "../../controllers/menu/drinksController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(drinksController.getAllDrinks)
  .post(validateAuthCookie(["admin"]), upload.single("image"), drinksController.insertDrink);

router
  .route("/:id")
  .put(validateAuthCookie(["admin"]), upload.single("image"), drinksController.updateDrink)
  .delete(validateAuthCookie(["admin"]), drinksController.deleteDrink);

export default router;