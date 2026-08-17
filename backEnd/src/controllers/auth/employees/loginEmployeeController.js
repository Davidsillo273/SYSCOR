// Importamos el modelo de empleados y utilidades para iniciar sesión
import EmployeeModel from "../../../models/users/employeeModel.js";
import processLogin, { processLoginByAccessCode, findByAccessCode } from "../../../utils/auth/loginUtils.js";
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

// Paso 1 del login con código (pantalla de Login, "¿Empleado con permisos?"):
// solo confirma que el código existe y está activo, todavía no autentica a nadie.
loginEmployeeController.verifyAccessCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== "string") {
            return res.status(400).json({ title: "Código requerido", message: "Ingresa tu código de acceso." });
        }

        const employee = await findByAccessCode(EmployeeModel, code.trim().toUpperCase());
        if (!employee) {
            return res.status(404).json({ title: "Código inválido", message: "El código de acceso no es válido." });
        }

        return res.status(200).json({ title: "Código válido", message: "Código verificado.", name: employee.personalInfo?.name || "" });
    } catch (error) {
        console.error("loginEmployeeController.verifyAccessCode:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al verificar el código." });
    }
};

// Paso 2: código + contraseña -> inicia sesión igual que el login normal
loginEmployeeController.loginWithAccessCode = async (req, res) => {
    try {
        const { code, password } = req.body;
        if (!code || !password) {
            return res.status(400).json({ title: "Datos incompletos", message: "Falta el código de acceso o la contraseña." });
        }

        const result = await processLoginByAccessCode(EmployeeModel, code.trim().toUpperCase(), password);

        if (result.error) {
            return res.status(result.status).json({ title: result.title, message: result.message });
        }

        res.cookie("authCookie", result.token, cookieConfig);

        return res.status(200).json({ title: "Bienvenido", message: result.message });
    } catch (error) {
        console.error("loginEmployeeController.loginWithAccessCode:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al iniciar sesión." });
    }
};

export default loginEmployeeController;
