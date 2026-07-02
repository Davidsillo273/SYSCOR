// Importamos mongoose para interactuar con la base de datos
import {Schema, model} from "mongoose"

// Definimos la estructura de datos para las Bebidas (Drinks)
const drinkSchema = new Schema({
    // Enlace a la foto de la bebida
    image: { type: String },
    // Nombre de la bebida
    name: { type: String },
    // Precio de venta
    price: { type: Number },
    // Cantidad en inventario
    quantity: { type: Number },
    // Estado (ej. disponible, inactiva)
    status: { type: String },
    // ID para identificar la imagen en la nube
    public_id: { type: String }
}, 
{
    // Guarda las fechas de cuándo se creó o modificó
    timestamps: true,
    strict: false
})

export default model("Drinks", drinkSchema)