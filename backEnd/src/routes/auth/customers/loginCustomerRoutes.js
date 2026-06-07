import express from "express";

import loginCustomerController from "../../../controllers/auth/customers/loginCustomerController.js";

const router = express.Router();
    
router.route("/").post(loginCustomerController.loginCustomer);

export default router;