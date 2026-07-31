import express from "express";
import saucersController from "../../controllers/menu/saucersController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(saucersController.getAllSaucers)
  .post(upload.single("image"), saucersController.insertSaucer);

  router.get("/active", validateAuthCookie(["customer", "admin"]), saucersController.getActiveSaucers);

  // Ranking de platillos más vendidos
  router.get("/best-sellers", saucersController.getBestSellers);

  // Revisa si ya existe un platillo con ese nombre (sugerencia, no bloqueo)
  router.get("/check-name", saucersController.checkName);

router
  .route("/:id")
  .patch(upload.single("image"), saucersController.updateSaucer)
  .delete(saucersController.deleteSaucer);

export default router;