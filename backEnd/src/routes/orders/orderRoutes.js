import { Router } from "express";
import orderController from "../../controllers/orders/orderController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

router.post("/", validateAuthCookie(["employee", "admin"]),orderController.createOrder);
router.get("/", orderController.getOrders);
router.put("/:id/status", validateAuthCookie(["employee", "admin"]),orderController.updateOrderStatus);
router.delete("/:id", validateAuthCookie(["admin"]), orderController.deleteOrder);

router.get('/waiter/dashboard', validateAuthCookie(["employee"]), orderController.getWaiterDashboard);

export default router;