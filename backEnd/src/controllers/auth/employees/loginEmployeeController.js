// Importamos el modelo de empleados y utilidades para iniciar sesión
import EmployeeModel from "../../../models/users/employeeModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";
import cookieConfig from "../../../config/cookieConfig.js";

const loginEmployeeController = {};

// Función principal para que los empleados inicien sesión
loginEmployeeController.loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await processLogin(EmployeeModel, email, password, "employee");

        if (result.error) {
            return res.status(result.status).json({ title: result.title, message: result.message });
        }

        res.cookie("authCookie", result.token, cookieConfig);

        return res.status(200).json({ title: "Bienvenido", message: result.message });
    } catch (error) {
        console.error("loginEmployeeController.loginEmployee:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al iniciar sesión." });
    }
};

export default loginEmployeeController;
