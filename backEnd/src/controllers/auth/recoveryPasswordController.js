// Importamos bcrypt para encriptar las nuevas contraseñas y los modelos de usuarios
import bcrypt from "bcryptjs";

import Admin from "../../models/users/adminModel.js";
import Employees from "../../models/users/employeeModel.js";
import Customers from "../../models/users/customerModel.js";

import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import emailUtils from "../../utils/auth/emailUtils.js";
import cookieConfig from "../../config/cookieConfig.js";
import recoveryResponse from "../../utils/auth/recoveryPasswordUtils.js";

// Mapea el string `userType` enviado por el cliente a su modelo de
// Mongoose correspondiente, para que este único controlador pueda manejar
// la recuperación de contraseña de los tres roles sin duplicar lógica
const ROLES_MODELS = {
    admin: Admin,
    employee: Employees,
    customer: Customers,
};

const recoveryPasswordController = {};

/**
 * PASO 1 — Solicitar código de recuperación
 * Busca al usuario por correo + rol, genera un código de verificación, y
 * lo envía por correo. El token también lleva `userType` para que los
 * siguientes pasos sepan qué modelo consultar sin que el cliente tenga
 * que reenviarlo cada vez.
 */
recoveryPasswordController.requestCode = async (req, res) => {
    try {
        const { email, userType } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validateEmail(email)
        ]);
        if (!validation.valid) {
            return res.status(400).json(recoveryResponse.requestCode.invalidEmail(validation.message));
        }

        // Rechaza roles no soportados/desconocidos antes de consultar la DB
        const targetModel = ROLES_MODELS[userType];
        if (!targetModel) {
            return res.status(400).json(recoveryResponse.requestCode.invalidUserType);
        }

        const userFound = await targetModel.findOne({ "loginInfo.email": email.toLowerCase() });
        if (!userFound) {
            return res.status(404).json(recoveryResponse.requestCode.userNotFound);
        }

        const code = emailUtils.generateVerificationCode();
        // verified: false marca que el código aún no ha sido confirmado —
        // el paso 3 chequea este flag antes de permitir el cambio de contraseña
        const token = emailUtils.generateToken({ email, code, userType, verified: false }, "15m");

        await emailUtils.sendEmail(
            email,
            "SYSCOR - Password Recovery",
            emailUtils.HTMLRecoveryEmail(code)
        );

        res.cookie("recoveryCookie", token, { ...cookieConfig, maxAge: 15 * 60 * 1000 });

        return res.status(200).json(recoveryResponse.requestCode.success);
    } catch (error) {
        console.error("Error in requestCode:", error);
        return res.status(500).json(recoveryResponse.requestCode.serverError);
    }
};

/**
 * PASO 2 — Verificar código
 * Confirma que el código enviado coincide con el del token, y luego vuelve
 * a emitir la cookie con `verified: true` para que el paso 3 sepa que es
 * seguro continuar.
 */
recoveryPasswordController.verifyCode = async (req, res) => {
    try {
        const { codeRequest } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validateVerificationCode(codeRequest)
        ]);
        if (!validation.valid) {
            return res.status(400).json(recoveryResponse.verifyCode.invalidCode(validation.message));
        }

        const token = req.cookies.recoveryCookie;
        if (!token) {
            return res.status(401).json(recoveryResponse.verifyCode.sessionExpired);
        }

        const decoded = emailUtils.verifyToken(token);

        if (codeRequest.toUpperCase() !== decoded.code) {
            return res.status(400).json(recoveryResponse.verifyCode.incorrectCode);
        }

        // Reemite la cookie conservando email + userType, ahora marcada como verificada
        const newToken = emailUtils.generateToken(
            { email: decoded.email, userType: decoded.userType, verified: true },
            "15m"
        );

        res.cookie("recoveryCookie", newToken, { ...cookieConfig, maxAge: 15 * 60 * 1000 });

        return res.status(200).json(recoveryResponse.verifyCode.success);
    } catch (error) {
        console.error("Error in verifyCode:", error);
        return res.status(500).json(recoveryResponse.verifyCode.serverError);
    }
};

/**
 * PASO 3 — Establecer nueva contraseña
 * Valida la nueva contraseña (y que coincida con su confirmación), confirma
 * que la cookie de recuperación realmente fue verificada en el paso 2, y
 * luego actualiza la contraseña directamente en el documento del usuario
 * correspondiente — también reseteando `loginAttempts` y `timeOut`,
 * levantando efectivamente cualquier bloqueo de cuenta.
 */
recoveryPasswordController.newPassword = async (req, res) => {
    try {
        const { newPassword, confirmNewPassword } = req.body;

        const validation = validationUtils.runValidations([
            () => validationUtils.validatePassword(newPassword)
        ]);
        if (!validation.valid) {
            return res.status(400).json(recoveryResponse.newPassword.invalidPassword(validation.message));
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json(recoveryResponse.newPassword.passwordsMismatch);
        }

        const token = req.cookies.recoveryCookie;
        if (!token) {
            return res.status(401).json(recoveryResponse.newPassword.sessionExpired);
        }

        const decoded = emailUtils.verifyToken(token);

        // Bloquea a cualquiera que intente llamar este endpoint sin haber
        // pasado primero por el paso 2 (es decir, token.verified sigue en false)
        if (!decoded.verified) {
            return res.status(403).json(recoveryResponse.newPassword.notVerified);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        const targetModel = ROLES_MODELS[decoded.userType];

        // También resetea loginAttempts/timeOut, así una contraseña
        // recuperada limpia de paso cualquier bloqueo previo por intentos fallidos
        await targetModel.findOneAndUpdate(
            { "loginInfo.email": decoded.email },
            { $set: { "loginInfo.password": passwordHash, "loginInfo.loginAttempts": 0, "loginInfo.timeOut": null } },
            { new: true }
        );

        res.clearCookie("recoveryCookie", cookieConfig);

        return res.status(200).json(recoveryResponse.newPassword.success);
    } catch (error) {
        console.error("Error in newPassword:", error);
        return res.status(500).json(recoveryResponse.newPassword.serverError);
    }
};

export default recoveryPasswordController;