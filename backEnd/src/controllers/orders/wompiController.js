// Importamos configuración global y el modelo del carrito
import { config } from "../../../config.js";
import CartModel from "../../models/orders/cartModel.js";

const wompiController = {};

// Función para conectarnos con Wompi (pasarela de pagos) y obtener un token de acceso
wompiController.generateToken = async (req, res) => {
    try {
        // Hacemos una petición a los servidores de Wompi enviando nuestras credenciales
        const response = await fetch("https://id.wompi.sv/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: config.wompi.grantType,
                audience: config.wompi.audience,
                client_id: config.wompi.clientId,
                client_secret: config.wompi.clientSecret,
            }),
        });

        const data = await response.json();

        // Si Wompi nos rechaza, devolvemos el error al usuario
        if (!response.ok) {
            return res.status(response.status).json({
                title: "Error de pago",
                message: "No se pudo generar el token de acceso a Wompi.",
                error: data,
            });
        }

        // Si todo va bien, entregamos el token generado
        return res.status(200).json(data);
    } catch (error) {
        console.error("wompiController.generateToken:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al generar el token de pago." });
    }
};

// Función para procesar un pago real con una tarjeta
wompiController.paymentTest = async (req, res) => {
    try {
        // Obtenemos el token de Wompi, el token de la tarjeta y qué carrito vamos a pagar
        const { token, cardToken, cartId } = req.body;

        // Buscamos el carrito en la base de datos
        const cartFound = await CartModel.findById(cartId).populate("customerId");
        if (!cartFound) {
            return res.status(404).json({ title: "Carrito no encontrado", message: "No se encontró el carrito solicitado." });
        }

        // Le enviamos a Wompi los datos del pago (monto, correo del cliente y token de la tarjeta)
        const response = await fetch("https://api.wompi.sv/v1/Transaccion", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                monto: cartFound.total,
                email: cartFound.customerId?.loginInfo?.email || "customer@syscor.com",
                configuracion: {
                    urls: {
                        respuesta: `${config.appUrl}/payment/response`,
                    },
                },
                tarjeta: {
                    token: cardToken,
                },
            }),
        });

        const result = await response.json();

        // Si la transacción falla en Wompi, enviamos el error
        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        // Si el pago es exitoso, actualizamos el carrito a "pagado"
        cartFound.status = "paid";
        await cartFound.save();

        return res.status(200).json({
            title: "Pago exitoso",
            message: "El pago se procesó correctamente.",
            data: result,
        });
    } catch (error) {
        console.error("wompiController.paymentTest:", error);
        return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al procesar el pago." });
    }
};

export default wompiController;