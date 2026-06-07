import express from "express";

import loginEmployeeController from "../../../controllers/auth/employees/loginEmployeeController.js";

const router = express.Router();
    
router.route("/").post(loginEmployeeController.loginEmployee);

export default router;