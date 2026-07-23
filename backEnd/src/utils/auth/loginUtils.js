import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config.js";

const processLogin = async (Model, email, password, role) => {

    const userFound = await Model.findOne({ "loginInfo.email": email });

    // 1. Usuario no encontrado
    if (!userFound) {
        return {
            error: true,
            status: 404,
            title: "Usuario no encontrado",
            message: "No existe ninguna cuenta asociada a este correo electrónico."
        };
    }

    // 2. Cuenta bloqueada actualmente por tiempo
    if (userFound.loginInfo.timeOut && userFound.loginInfo.timeOut > Date.now()) {
        return {
            error: true,
            status: 403,
            title: "Cuenta bloqueada",
            message: "Cuenta bloqueada por múltiples intentos fallidos. Por favor, inténtelo de nuevo más tarde."
        };
    }

    const isMatch = await bcrypt.compare(password, userFound.loginInfo.password);

    // 3. Contraseña incorrecta e incremento de intentos
    if (!isMatch) {
        userFound.loginInfo.loginAttempts = (userFound.loginInfo.loginAttempts || 0) + 1;

        if (userFound.loginInfo.loginAttempts >= 5) {
            userFound.loginInfo.timeOut = Date.now() + 15 * 60 * 1000;
            userFound.loginInfo.loginAttempts = 0;
            await userFound.save();

            return {
                error: true,
                status: 403,
                title: "Demasiados intentos fallidos",
                message: "Su cuenta ha sido bloqueada temporalmente por 15 minutos."
            };
        }

        await userFound.save();
        return {
            error: true,
            status: 401,
            title: "Contraseña incorrecta",
            message: "Por favor, verifique e inténtelo de nuevo."
        };
    }

    // 4. Éxito: Reiniciar intentos y timeout
    userFound.loginInfo.loginAttempts = 0;
    userFound.loginInfo.timeOut = null;
    await userFound.save();

    const tokenPayload = {
        id: userFound._id,
        role: role,
        permissions: userFound.permissions || [],
        tokenVersion: userFound.tokenVersion || 0
    };

    const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || config.JWT.secret,
        { expiresIn: "30d" }
    );

    return {
        error: false,
        status: 200,
        token,
        message: "Inicio de sesión exitoso"
    };
};

export default processLogin;