import express from "express";
import aiController from "../../controllers/ai/aiController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

// Ambas asistencias de IA son solo para el administrador
router.post("/suggest-recipe", validateAuthCookie(["admin"]), aiController.suggestRecipe);
router.get("/stock-forecast", validateAuthCookie(["admin"]), aiController.stockForecast);

export default router;
