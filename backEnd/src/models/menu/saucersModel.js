// Importamos mongoose para la base de datos
import mongoose, {Schema, model} from "mongoose"

// Unidades de medida más comunes para describir cantidades de una receta
const RECIPE_UNITS = ["unidad", "g", "kg", "ml", "l", "cucharadita", "cucharada", "taza", "vaso", "pizca"];

// Definimos la estructura para los Platos principales (Saucers)
const saucersSchema = new Schema({
    // Foto del plato (opcional: si no hay, el front usa un placeholder)
    image: { type: String },
    // Nombre del platillo
    name: { type: String },
    // Categoría fija del platillo
    category: { type: String, enum: ["Burritos", "Tortas", "Tacos", "Sopas", "Especiales"] },
    // Solo aplica si category es Burritos/Tortas/Tacos
    isBirria: { type: Boolean, default: false },
    // Precio del plato
    price: { type: Number },
    // Si está disponible a la venta. Nace 'Activo' por default
    status: { type: String, default: "Activo" },
    // Identificador de la imagen alojada
    public_id: { type: String },
    // Receta opcional: ingredientes del platillo, igual que en Drinks, con un
    // flag extra para saber si el cliente puede pedir que se lo quiten
    recipe: [{
        name: { type: String },
        tracked: { type: Boolean, default: false },
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", default: null },
        removable: { type: Boolean, default: false },
        quantity: { type: String },
        unit: { type: String, enum: RECIPE_UNITS }
    }]
},
{
    // Registra fechas de movimiento
    timestamps: true,
    strict: false
})

export default model("Saucers", saucersSchema)