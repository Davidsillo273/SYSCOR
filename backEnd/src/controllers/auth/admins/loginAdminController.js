// Importamos el modelo de Administrador y las utilidades para iniciar sesión
import adminModel from "../../../models/users/adminModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";
import cookieConfig from "../../../config/cookieConfig.js";

const loginAdminController = {};

// Función principal para que los administradores inicien sesión
loginAdminController.loginAdmin = async (req, res) => {
    try {
        // Obtenemos el correo y la contraseña que el admin escribió en el formulario
        const { email, password } = req.body;

        // Usamos nuestra herramienta processLogin para verificar si las credenciales son correctas
        // Le pasamos el modelo, el correo, la contraseña y especificamos que es un "admin"
        const result = await processLogin(adminModel, email, password, "admin");

        // Si processLogin nos devuelve un error (contraseña incorrecta, usuario no existe, etc)
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        // Si todo está bien, guardamos el token generado en una cookie en el navegador
        res.cookie("authCookie", result.token, cookieConfig);

        // Y le damos la bienvenida con un mensaje de éxito
        return res.status(200).json({ message: result.message });
    } catch (error) {
        // Capturamos cualquier error inesperado del servidor
        console.error("Error in Admin login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default loginAdminController;