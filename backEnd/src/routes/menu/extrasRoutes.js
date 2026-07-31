import express from "express";
import extrasController from "../../controllers/menu/extrasController.js";
import upload from "../../utils/cloudinaryConfig.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(extrasController.getExtras)
  .post(upload.single("image"), extrasController.insertExtras);

router.get("/active", validateAuthCookie(["customer", "admin"]), extrasController.getActiveExtras);

// Ranking de extras más pedidos
router.get("/best-sellers", extrasController.getBestSellers);

// Revisa si ya existe un extra con ese nombre (sugerencia, no bloqueo)
router.get("/check-name", extrasController.checkName);

router
  .route("/:id")
  .patch(upload.single("image"), extrasController.updateExtra)
  .delete( extrasController.deleteExtra);

export default router;
