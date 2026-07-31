import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteEmployeeController from "../../../controllers/auth/employees/inviteEmployeeController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

router.post("/send-invitation", inviteEmployeeController.sendInvitation);
router.get("/check-invitation", inviteEmployeeController.validateInvitation);
router.post("/accept-invitation", upload.single("image"), inviteEmployeeController.acceptInvitation);
export default router;