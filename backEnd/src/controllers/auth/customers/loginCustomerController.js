// Importamos el modelo de Cliente y la herramienta para procesar los inicios de sesión
import CustomerModel from "../../../models/users/customerModel.js";
import processLogin from "../../../utils/auth/loginUtils.js";
import cookieConfig from "../../../config/cookieConfig.js";

const loginCustomerController = {};

// Esta función permite que los clientes entren a su cuenta
loginCustomerController.loginCustomer = async (req, res) => {
    try {
        // Extraemos los datos que nos envía el cliente
        const { email, password } = req.body;

        // Comprobamos los datos usando nuestra función centralizada de inicio de sesión
        // Indicamos claramente que estamos autenticando a un "customer" (cliente)
        const result = await processLogin(CustomerModel, email, password, "customer");

        // Si hay algún problema (no existe el correo o la clave está mal) devolvemos error
        if (result.error) {
            return res.status(result.status).json({ title: result.title, message: result.message });
        }

        // Si pasó las pruebas, creamos su "llave" (cookie) para que mantenga su sesión abierta
        res.cookie("authCookie", result.token, cookieConfig);

        // Respondemos que todo salió perfecto
        return res.status(200).json({ title: "Bienvenido", message: result.message });
    } catch (error) {
        // Si el servidor falla por algún motivo, lo registramos
        console.error("loginCustomerController.loginCustomer:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al iniciar sesión." });
    }
};

export default loginCustomerController;
