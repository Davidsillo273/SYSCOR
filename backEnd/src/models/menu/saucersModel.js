// Importamos mongoose para la base de datos
import {Schema, model} from "mongoose"

// Definimos la estructura para los Platos principales (Saucers)
const saucersSchema = new Schema({
    // Foto del plato
    image: { type: String },
    // Nombre del platillo
    name: { type: String },
    // A qué categoría pertenece (ej. entradas, postres)
    category: { type: String },
    // Precio del plato
    price: { type: Number },
    // Si está disponible a la venta
    status: { type: String },
    // Identificador de la imagen alojada
    public_id: { type: String }
}, 
{
    // Registra fechas de movimiento
    timestamps: true,
    strict: false
})

export default model("Saucers", saucersSchema)