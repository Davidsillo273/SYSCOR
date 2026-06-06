import express from "express";
import registerAdminController from "../../../controllers/auth/admins/registerAdminController.js";

const router = express.Router();
router.post("/sendCode", registerAdminController.sendCode);
router.post("/verifyCode", registerAdminController.verifyCode);
router.post("/personalInfo", registerAdminController.personalInfo);
router.post("/setPassword", registerAdminController.setPassword);

export default router;