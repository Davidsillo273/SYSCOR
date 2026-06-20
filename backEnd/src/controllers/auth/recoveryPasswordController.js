import bcrypt from "bcryptjs";

import Admin from "../../models/users/adminModel.js";
import Employees from "../../models/users/employeeModel.js";
import Customers from "../../models/users/customerModel.js";

import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import emailUtils from "../../utils/auth/emailUtils.js";
import  cookieConfig  from "../../config/cookieConfig.js";

const ROLES_MODELS = {
    admin: Admin,
    employee: Employees,
    customer: Customers,
};

const recoveryPasswordController = {};

recoveryPasswordController.requestCode = async (req, res) => {
    try {
        const { email, userType } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validateEmail(email)
        ]);
        if (!validation.valid) return res.status(400).json({ message: validation.message });

        const targetModel = ROLES_MODELS[userType];
        if (!targetModel) {
            return res.status(400).json({ message: "Invalid user type." });
        }

        const userFound = await targetModel.findOne({ "loginInfo.email": email.toLowerCase() });
        if (!userFound) {
            return res.status(404).json({ message: "User not found." });
        }

        const code = emailUtils.generateVerificationCode();
        const token = emailUtils.generateToken({ email, code, userType, verified: false }, "15m");

        await emailUtils.sendEmail(
            email,
            "SYSCOR - Password Recovery",
            emailUtils.HTMLRecoveryEmail(code)
        );

        res.cookie("recoveryCookie", token, { ...cookieConfig, maxAge: 15 * 60 * 1000 });

        return res.status(200).json({ message: "Recovery email sent." });
    } catch (error) {
        console.error("Error in requestCode:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

recoveryPasswordController.verifyCode = async (req, res) => {
    try {
        const { codeRequest } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validateVerificationCode(codeRequest)
        ]);
        if (!validation.valid) return res.status(400).json({ message: validation.message });

        const token = req.cookies.recoveryCookie;
        if (!token) return res.status(401).json({ message: "Recovery session expired." });

        const decoded = emailUtils.verifyToken(token);

        if (codeRequest.toUpperCase() !== decoded.code) {
            return res.status(400).json({ message: "Invalid or incorrect code." });
        }

        const newToken = emailUtils.generateToken(
            { email: decoded.email, userType: decoded.userType, verified: true },
            "15m"
        );

        res.cookie("recoveryCookie", newToken, { ...cookieConfig, maxAge: 15 * 60 * 1000 });

        return res.status(200).json({ message: "Code verified successfully. Proceed to change your password." });
    } catch (error) {
        console.error("Error in verifyCode:", error);
        return res.status(500).json({ message: "Internal server error or expired token." });
    }
};

recoveryPasswordController.newPassword = async (req, res) => {
    try {
        const { newPassword, confirmNewPassword } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validatePassword(newPassword)
        ]);
        if (!validation.valid) return res.status(400).json({ message: validation.message });

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const token = req.cookies.recoveryCookie;
        if (!token) return res.status(401).json({ message: "Recovery session expired." });

        const decoded = emailUtils.verifyToken(token);

        if (!decoded.verified) {
            return res.status(403).json({ message: "You must verify the code first." });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        const targetModel = ROLES_MODELS[decoded.userType];

        await targetModel.findOneAndUpdate(
            { "loginInfo.email": decoded.email },
            { $set: { "loginInfo.password": passwordHash, "loginInfo.loginAttempts": 0, "loginInfo.timeOut": null } },
            { new: true }
        );

        res.clearCookie("recoveryCookie", cookieConfig);

        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error in newPassword:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

export default recoveryPasswordController;