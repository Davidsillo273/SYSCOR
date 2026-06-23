import express from "express";
import tablesController from "../../controllers/menu/tablesController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(validateAuthCookie(["admin"]), tablesController.getTables)
  .post(validateAuthCookie(["admin"]), tablesController.insertTable);

router
  .route("/:id")
  .put(validateAuthCookie(["admin"]), tablesController.updateTable)
  .delete(validateAuthCookie(["admin"]), tablesController.deleteTable);

export default router;