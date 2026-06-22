import express from "express";
import customerController from "../../controllers/users/customerController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router.route("/").get(validateAuthCookie(["admin"]), customerController.getCustomers);
router
    .route("/:id")
    .put(validateAuthCookie(["customer", "admin"]), customerController.updateCustomer)

export default router;
