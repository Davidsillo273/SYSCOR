import express from "express";
import customerController from "../../controllers/users/customerController.js";
import { validateAuthCookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router.route("/").get(customerController.getCustomers);
router
    .route("/:id")
    .put( customerController.updateCustomer)

export default router;
