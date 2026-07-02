import express from "express";
import employeeController from "../../controllers/users/employeeController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import upload from "../../utils/cloudinaryConfig.js";
const router = express.Router();

router.route("/").get(employeeController.getEmployees);
router.patch("/:id", validateAuthCookie(["admin", "employee"]), upload.single("image"), employeeController.updateEmployee);
export default router;
