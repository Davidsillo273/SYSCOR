import { Router } from "express";
import orderController from "../../controllers/orders/orderController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

router.use(validateAuthCookie);

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.put("/:id/status", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);

router.get('/waiter/dashboard', validateAuthCookie(["employee"]), orderController.getWaiterDashboard);

export default router;