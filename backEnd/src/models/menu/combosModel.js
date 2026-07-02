// Importamos mongoose para manejar la base de datos
import mongoose, {Schema, model} from "mongoose"

// Definimos la estructura de datos para un Combo del menú
const CombosSchema = new Schema({
    // URL de la imagen del combo
    image: { type: String },
    // Nombre del combo
    name: { type: String },
    // Platos principales que incluye (hace referencia a Saucers)
    saucersId: { type: mongoose.Schema.Types.ObjectId, ref: "Saucers" },
    // Bebidas que incluye (hace referencia a Drinks)
    drinksId: { type: mongoose.Schema.Types.ObjectId, ref: "Drinks" },
    // Precio del combo
    price: { type: Number },
    // Cantidad disponible
    quantity: { type: Number },
    // Breve descripción de lo que incluye
    description: { type: String },
    // Estado (ej. disponible, agotado)
    status: { type: String },
    // ID público de la imagen (usualmente para Cloudinary)
    public_id: { type: String }
}, 
{
    // Registra fecha de creación y actualización
    timestamps: true,
    strict: false
})

export default model("Combos", CombosSchema)