import express from "express";
import saucersController from "../controllers/saucersControlle.js";
import upload from "../utils/cloudinaryConfig.js";
const router = express.Router();

router
  .route("/")
  .get(saucersController.getAllSaucers)
  .post(upload.single("image"), saucersController.insertSaucer);

router
  .route("/:id")
  .put(upload.single("image"), saucersController.updateSaucer)
  .delete(saucersController.deleteSaucer);

export default router;