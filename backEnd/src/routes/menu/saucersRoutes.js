import express from "express";
import saucersController from "../../controllers/menu/saucersControlle.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(saucersController.getAllSaucers)
  .post(validateAuthCookie(["admin"]), upload.single("image"), saucersController.insertSaucer);

router
  .route("/:id")
  .put(validateAuthCookie(["admin"]), upload.single("image"), saucersController.updateSaucer)
  .delete(validateAuthCookie(["admin"]), saucersController.deleteSaucer);

export default router;