import express from "express";

import loginAdminController from "../../../controllers/auth/admins/loginAdminController.js";

const router = express.Router();

router.route("/").post(loginAdminController.loginAdmin);

export default router;