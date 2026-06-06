import express from "express";
import registerCustomerController from "../../../controllers/auth/customers/registerCustomerController.js";

const router = express.Router();
router.post("/sendCode", registerCustomerController.sendCode);
router.post("/verifyCode", registerCustomerController.verifyCode);
router.post("/personalInfo", registerCustomerController.personalInfo);
router.post("/setPassword", registerCustomerController.setPassword);

export default router;