import express from "express";
import employeeController from "../controllers/employeeController.js";

const router = express.Router();

router.route("/").get(employeeController.getEmployees);
router
    .route("/:id")
    .put(employeeController.updateEmployee)
    .delete(employeeController.deleteEmployee);

export default router;
