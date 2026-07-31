import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteAdminController from "../../../controllers/auth/admins/inviteAdminController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

router.post("/send-invitation", inviteAdminController.sendInvitation);
router.get("/check-invitation", inviteAdminController.validateInvitation);
router.post("/accept-invitation", upload.single("image"), inviteAdminController.acceptInvitation);

export default router;