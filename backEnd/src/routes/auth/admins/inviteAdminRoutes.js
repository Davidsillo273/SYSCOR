import { Router } from "express";
import { validateAuthCookie } from "../../../middlewares/auth/authMiddleware.js";
import inviteAdminController from "../../../controllers/auth/admins/inviteAdminController.js";
import upload from "../../../utils/cloudinaryConfig.js";
const router = Router();

router.post("/sendInvitation", inviteAdminController.sendInvitation);
router.get("/checkInvitation", inviteAdminController.validateInvitation);
router.post("/acceptInvitation", upload.single("image"), inviteAdminController.acceptInvitation);

export default router;