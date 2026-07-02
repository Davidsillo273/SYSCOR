import express from "express";
import saucersController from "../../controllers/menu/saucersControlle.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(saucersController.getAllSaucers)
  .post(upload.single("image"), saucersController.insertSaucer);

  router.get("/active", validateAuthCookie(["customer", "admin"]), saucersController.getActiveSaucers);
  
router
  .route("/:id")
  .put(upload.single("image"), saucersController.updateSaucer)
  .delete(saucersController.deleteSaucer);

export default router;