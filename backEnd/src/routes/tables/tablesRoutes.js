import express from "express";
import tablesController from "../../controllers/tables/tablesController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(tablesController.getTables)
  .post(tablesController.insertTable);

router
  .route("/:id")
  .patch(tablesController.updateTable)
  .delete(tablesController.deleteTable);

export default router;