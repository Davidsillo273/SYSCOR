import express from "express";
import extrasController from "../../controllers/menu/extrasController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(extrasController.getExtras)
  .post(extrasController.insertExtras);

router.get("/active", validateAuthCookie(["customer", "admin"]), extrasController.getActiveExtras);

// Ranking de extras más pedidos
router.get("/best-sellers", extrasController.getBestSellers);

router
  .route("/:id")
  .put(extrasController.updateExtra)
  .delete( extrasController.deleteExtra);

export default router;
