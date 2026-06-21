import express from "express";
import extrasController from "../../controllers/menu/extrasController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(extrasController.getExtras)
  .post(validateAuthCookie(["admin"]), extrasController.insertExtras);

router
  .route("/:id")
  .put(validateAuthCookie(["admin"]), extrasController.updateExtra)
  .delete(validateAuthCookie(["admin"]), extrasController.deleteExtra);

export default router;
