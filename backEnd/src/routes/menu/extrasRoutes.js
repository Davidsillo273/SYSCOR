import express from "express";
import extrasController from "../../controllers/menu/extrasController.js";

const router = express.Router();

router
  .route("/")
  .get( extrasController.getExtras)
  .post( extrasController.insertExtras);

  router.get (extrasController.getActiveExtras);

router
  .route("/:id")
  .put (extrasController.updateExtra)
  .delete( extrasController.deleteExtra);

export default router;
