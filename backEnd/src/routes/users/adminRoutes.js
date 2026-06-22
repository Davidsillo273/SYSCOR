import express from "express";
import adminController from "../../controllers/users/adminController.js";
import upload from "../../utils/cloudinaryConfig.js";
const router = express.Router();

router.route("/").get(adminController.getAdmins);
router.patch("/:id", upload.single("image"), adminController.updateAdmin);

export default router;
