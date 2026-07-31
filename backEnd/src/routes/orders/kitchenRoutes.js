import { Router } from "express";
import kitchenController from "../../controllers/orders/kitchenController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();
router.get("/", validateAuthCookie, kitchenController.getKitchenOrders);
export default router;