import { config } from "../../../config.js";
import cartModel from "../../models/orders/cartModel.js";

const wompiController = {};

wompiController.generarToken = async (req, res) => {
    try {
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

        if (!response.ok) {
            return res.status(response.status).json({
                message: "Error al generar el token de acceso a Wompi",
                error: data,
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Wompi Token Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

wompiController.paymentTest = async (req, res) => {
    try {
        const { token, cardToken, cartId } = req.body;

        const cartFound = await cartModel.findById(cartId).populate("idCustomer");
        if (!cartFound) {
            return res.status(404).json({ message: "Carrito no encontrado" });
        }

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

        if (!response.ok) {
            return res.status(response.status).json(result);
        }

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