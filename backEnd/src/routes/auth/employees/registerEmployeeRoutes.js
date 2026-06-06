import express from "express";
import registerEmployeeController from "../../../controllers/auth/employees/registerEmployeeController.js";

const router = express.Router();
router.post("/sendCode", registerEmployeeController.sendCode);
router.post("/verifyCode", registerEmployeeController.verifyCode);
router.post("/personalInfo", registerEmployeeController.personalInfo);
router.post("/setPassword", registerEmployeeController.setPassword);

export default router;