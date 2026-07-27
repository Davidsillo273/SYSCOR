// Importamos mongoose para manejar la base de datos
import mongoose, {Schema, model} from "mongoose"

// Definimos la estructura de datos para un Combo del menú
const CombosSchema = new Schema({
    // URL de la imagen del combo (opcional: si no hay, el front usa un placeholder)
    image: { type: String },
    // Nombre del combo
    name: { type: String },
    // Categoría del combo, usada para filtrar en el panel
    category: { type: String, enum: ["individual", "duo", "familiar"] },
    // Platillos que incluye el combo (uno o varios, hace referencia a Saucers)
    saucers: [{
        saucerId: { type: mongoose.Schema.Types.ObjectId, ref: "Saucers" }
    }],
    // Política de bebidas: el admin no elige la bebida del combo, define qué
    // puede elegir el cliente al momento de ordenar
    drinkPolicy: {
        // Bebidas de tercero permitidas, ya incluidas en el precio del combo
        thirdPartyDrinkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drinks" }],
        // Si se permite agregar una bebida de casa como extra pagado. El costo
        // de ese extra no se define aquí: se toma del precio de la bebida en
        // la colección Drinks al momento de armar el pedido.
        allowHouseDrinkAddon: { type: Boolean, default: false }
    },
    // Precio del combo
    price: { type: Number },
    // Cantidad disponible
    quantity: { type: Number },
    // Breve descripción de lo que incluye
    description: { type: String },
    // Estado (ej. disponible, no disponible). Nace 'disponible' por default
    status: { type: String, default: "disponible" },
    // ID público de la imagen (usualmente para Cloudinary)
    public_id: { type: String }
},
{
    // Registra fecha de creación y actualización
    timestamps: true,
    strict: false
})

export default model("Combos", CombosSchema)