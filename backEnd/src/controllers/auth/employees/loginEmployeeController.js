import employeeModel from "../../../models/employeeModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";

const loginEmployeeController = {};
loginEmployeeController.loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await processLogin(employeeModel, email, password, "employee");

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        res.cookie("authCookie", result.token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error in Employee login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default loginEmployeeController;