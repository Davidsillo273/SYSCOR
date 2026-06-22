import express from "express";
import cartController from "../controller/cartController.js";

const router = express.Router();

router.route("/")
  .get(cartController.getAllCarts)
  .post(cartController.insertCart);

router.route("/:id")
  .get(cartController.getCartById)
  .put(cartController.updateCart)
  .delete(cartController.deleteCart);

export default router;