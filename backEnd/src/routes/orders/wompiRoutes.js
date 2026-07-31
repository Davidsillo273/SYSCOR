import express from "express";
import wompiController from "../../controllers/orders/wompiController.js";

const router = express.Router();

router.route("/token").post(wompiController.generateToken);
router.route("/payment-test").post(wompiController.paymentTest);

export default router;