// Importamos mongoose para definir la estructura de nuestro carrito de compras
import mongoose, { Schema, model } from "mongoose";

// Definimos la estructura que tendrá cada Carrito (Orden) en la base de datos
const cartSchema = new Schema({
    // Identificador del cliente al que pertenece este carrito
    idCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer", // Hace referencia al modelo de Cliente
        required: true
    },
    // Mesa donde se atiende este pedido (opcional, ej. pedidos para llevar no tienen mesa)
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tables",
        default: null
    },
    // Lista de detalles que contiene los productos agregados al carrito
    details: [
        {
            // Lista de combos seleccionados
            combos: [
                {
                    comboId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Combos"
                    },
                    // Cuántos combos de este tipo quiere llevar (por defecto es 1)
                    quantity: { type: Number, default: 1 }
                }
            ],
            // Lista de extras (como acompañamientos)
            extras: [
                {
                    extraId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Extras"
                    },
                    // Bebidas que pueden venir con este extra
                    drinks: [
                        {
                            drinkId: {
                                type: mongoose.Schema.Types.ObjectId,
                                ref: "Drinks"
                            }
                        }
                    ],
                    // Cantidad de este extra
                    quantity: { type: Number, default: 1 }
                }
            ],
            // Subtotal a pagar por este bloque específico de detalles
            subTotal: { type: Number, required: true }
        }
    ],
    // Costo total de todo el carrito
    total: {
        type: Number,
        default: 0
    },
    // Estado actual del carrito (ej: pendiente, pagado, cancelado)
    status: {
        type: String
    }
}, {
    // Guarda automáticamente la fecha de creación y última modificación
    timestamps: true,
    // Solo permite guardar los campos que están estrictamente definidos arriba
    strict: true
});

// Exportamos el modelo para poder crear o buscar carritos
export default model("Cart", cartSchema);