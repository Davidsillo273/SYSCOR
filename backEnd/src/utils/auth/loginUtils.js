import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config.js";

const processLogin = async (Model, email, password, role) => {

    const userFound = await Model.findOne({ "loginInfo.email": email });

    if (!userFound) {
        return { error: true, status: 404, message: "User not found" };
    }

    if (userFound.loginInfo.timeOut && userFound.loginInfo.timeOut > Date.now()) {
        return { error: true, status: 403, message: "Account blocked due to multiple failed attempts" };
    }

    const isMatch = await bcrypt.compare(password, userFound.loginInfo.password);

    if (!isMatch) {
        userFound.loginInfo.loginAttempts = (userFound.loginInfo.loginAttempts || 0) + 1;

        if (userFound.loginInfo.loginAttempts >= 5) {
            userFound.loginInfo.timeOut = Date.now() + 15 * 60 * 1000;
            userFound.loginInfo.loginAttempts = 0;
            await userFound.save();

            return { error: true, status: 403, message: "Too many failed attempts. Account blocked for 15 minutes." };
        }

        await userFound.save();
        return { error: true, status: 401, message: "Incorrect email or password" };
    }

    userFound.loginInfo.loginAttempts = 0;
    userFound.loginInfo.timeOut = null;
    await userFound.save();

    const tokenPayload = {
        id: userFound._id,
        role: role,
        // Los permisos granulares solo existen en Employee (admin tiene
        // acceso total implícito vía requirePermission). userFound.permissions
        // será undefined para Admin/Customer, así que cae al array vacío.
        permissions: userFound.permissions || [],
        // "Foto" del tokenVersion actual en la DB al momento del login.
        // Si el admin luego cambia los permisos de este empleado, el
        // tokenVersion en la DB sube y este JWT queda desactualizado.
        tokenVersion: userFound.tokenVersion || 0
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || config.JWT.secret, { expiresIn: "30d" });

    return { error: false, status: 200, token, message: "Login successful" };
};
export default processLogin;