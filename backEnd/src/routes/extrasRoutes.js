import express from "express";
import extrasController from "../controllers/extrasController.js";

const router = express.Router();

router
  .route("/")
  .get(extrasController.getExtras)
  .post(extrasController.insertExtras);

router
  .route("/:id")
  .put(extrasController.updateExtra)
  .delete(extrasController.deleteExtra);

export default router;
