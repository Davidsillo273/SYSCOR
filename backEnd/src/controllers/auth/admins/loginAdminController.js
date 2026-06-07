import adminModel from "../../../models/adminModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";

const loginAdminController = {};

loginAdminController.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await processLogin(adminModel, email, password, "admin");

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        res.cookie("authCookie", result.token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        });

        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error in Admin login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default loginAdminController;