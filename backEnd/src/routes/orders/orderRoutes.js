import { Router } from "express";
import orderController from "../../controllers/orders/orderController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

// Cualquiera con sesión (mesero, admin o cliente) puede crear un pedido: los
// locales los crea un mesero/admin, los online los crea el propio cliente.
router.post("/", validateAuthCookie(["employee", "admin", "customer"]), orderController.createOrder);
router.get("/", orderController.getOrders);
router.put("/:id/status", validateAuthCookie(["employee", "admin"]), orderController.updateOrderStatus);
router.put("/:id/cancel", validateAuthCookie(["employee", "admin"]), orderController.cancelOrder);
router.delete("/:id", validateAuthCookie(["admin"]), orderController.deleteOrder);

router.get('/waiter/dashboard', validateAuthCookie(["employee"]), orderController.getWaiterDashboard);

export default router;
