import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteEmployeeController from "../../../controllers/auth/employees/inviteEmployeeController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

router.post("/sendInvitation", validateAuthCookie(["admin"]), inviteEmployeeController.sendInvitation);
router.get("/checkInvitation", inviteEmployeeController.validateInvitation);
router.post("/acceptInvitation", upload.single("image"), inviteEmployeeController.acceptInvitation);
export default router;