import express from "express";
import employeeController from "../../controllers/users/employeeController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
const router = express.Router();

router.route("/").get(employeeController.getEmployees);
router
    .route("/:id")
    .put(validateAuthCookie(["employee", "admin"]), employeeController.updateEmployee)

export default router;
