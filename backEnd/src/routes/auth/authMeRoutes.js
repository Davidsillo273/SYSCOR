import { Router } from "express";
import authMeController from "../../controllers/auth/authMeController.js";
import {validateAuthCookie} from "../../middlewares/auth/authMiddleware.js"; 

const router = Router();

router.get("/me", validateAuthCookie(["admin", "employee", "customer"]), authMeController.getMe);

export default router;