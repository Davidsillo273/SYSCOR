import express from "express";
import adminController from "../../controllers/users/adminController.js";

const router = express.Router();

router.route("/").get(adminController.getAdmins);
router
    .route("/:id")
    .put(adminController.updateAdmin)
    .delete(adminController.deleteAdmin);

export default router;
