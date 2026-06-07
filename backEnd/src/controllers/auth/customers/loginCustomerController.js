import customerModel from "../../../models/customerModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";
import cookieConfig from "../../../config/cookieConfig.js";

const loginCustomerController = {};

loginCustomerController.loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await processLogin(customerModel, email, password, "customer");

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        res.cookie("authCookie", result.token, cookieConfig);

        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error in Customer login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default loginCustomerController;