import express from "express";
import saucerChatController from "../../controllers/chat/saucerChatController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";
import { requirePermission } from "../../middlewares/auth/permissionMiddleware.js";

const router = express.Router();

router.post(
  "/saucer",
  validateAuthCookie(["admin", "employee"]),
  requirePermission("menu:create"),
  saucerChatController.chat
);

export default router;
