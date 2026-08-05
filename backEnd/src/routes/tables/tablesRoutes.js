import express from "express";
import tablesController from "../../controllers/tables/tablesController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(tablesController.getTables)
  .post(validateAuthCookie(["employee", "admin"]), tablesController.insertTable);

router
  .route("/:id")
  .put(validateAuthCookie(["employee", "admin"]), tablesController.updateTable)
  .delete(validateAuthCookie(["admin"]), tablesController.deleteTable);

export default router;