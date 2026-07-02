// Importamos la configuración de nuestra cookie para poder borrarla correctamente
import cookieConfig from "../../config/cookieConfig.js";

// Creamos un objeto vacío donde guardaremos las funciones de este controlador
const logoutController = {};

// Esta función se encarga de cerrar la sesión del usuario
logoutController.logout = async (req, res) => {
    try {
        // Borramos la cookie de autenticación del navegador del usuario
        res.clearCookie("authCookie", cookieConfig);
        // Respondemos con un mensaje de éxito
        return res.status(200).json({ message: "Session closed successfully" });
    } catch (error) {
        // Si algo sale mal, lo anotamos en la consola para revisarlo
        console.error("Error en logout:", error);
        // Y le decimos al usuario que hubo un problema interno
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Exportamos el controlador para conectarlo con nuestras rutas
export default logoutController;