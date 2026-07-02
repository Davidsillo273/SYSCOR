// Importamos configuración global y el modelo del carrito
import { config } from "../../../config.js";
import cartModel from "../../models/orders/cartModel.js";

const wompiController = {};

// Función para conectarnos con Wompi (pasarela de pagos) y obtener un token de acceso
wompiController.generarToken = async (req, res) => {
    try {
        // Hacemos una petición a los servidores de Wompi enviando nuestras credenciales
        const response = await fetch("https://id.wompi.sv/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: config.wompi.grant_type,
                audience: config.wompi.audience,
                client_id: config.wompi.client_id,
                client_secret: config.wompi.client_secret,
            }),
        });

        const data = await response.json();

        // Si Wompi nos rechaza, devolvemos el error al usuario
        if (!response.ok) {
            return res.status(response.status).json({
                message: "Error al generar el token de acceso a Wompi",
                error: data,
            });
        }

        // Si todo va bien, entregamos el token generado
        return res.status(200).json(data);
    } catch (error) {
        console.error("Wompi Token Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Función para procesar un pago real con una tarjeta
wompiController.paymentTest = async (req, res) => {
    try {
        // Obtenemos el token de Wompi, el token de la tarjeta y qué carrito vamos a pagar
        const { token, cardToken, cartId } = req.body;

        // Buscamos el carrito en la base de datos
        const cartFound = await cartModel.findById(cartId).populate("idCustomer");
        if (!cartFound) {
            return res.status(404).json({ message: "Carrito no encontrado" });
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
                email: cartFound.idCustomer?.loginInfo?.email || "customer@syscor.com",
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
            message: "Pago procesado exitosamente",
            data: result,
        });
    } catch (error) {
        console.error("Wompi Payment Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default wompiController;