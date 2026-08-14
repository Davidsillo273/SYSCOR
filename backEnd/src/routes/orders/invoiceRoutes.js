import { Router } from "express";
import invoiceController from "../../controllers/orders/invoiceController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = Router();

// Historial de facturación: solo lo consulta el personal del local
router.get("/", validateAuthCookie(["employee", "admin"]), invoiceController.getInvoices);
router.delete("/:id", validateAuthCookie(["admin"]), invoiceController.deleteInvoice);

export default router;
