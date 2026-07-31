import express from "express";
import registerCustomerController from "../../../controllers/auth/customers/registerCustomerController.js";

const router = express.Router();
router.post("/send-code", registerCustomerController.sendCode);
router.post("/verify-code", registerCustomerController.verifyCode);
router.post("/personal-info", registerCustomerController.personalInfo);
router.post("/set-password", registerCustomerController.setPassword);

export default router;