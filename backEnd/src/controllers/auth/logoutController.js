import cookieConfig from "../../config/cookieConfig.js";
const logoutController = {};

logoutController.logout = async (req, res) => {
    try {
        res.clearCookie("authCookie", cookieConfig);
        return res.status(200).json({ message: "Session closed successfully" });
    } catch (error) {
        console.error("Error en logout:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default logoutController;