import mongoose, {Schema, model} from "mongoose"

// Definimos la estructura de datos para un Combo del menú
const combosSchema = new Schema({
    // URL de la imagen del combo (opcional: si no hay, el front usa un placeholder)
    image: { type: String },
    // Nombre del combo
    name: { type: String },
    // Categoría del combo, usada para filtrar en el panel
    category: { type: String, enum: ["individual", "duo", "familiar"] },
    // Platillos incluidos de forma fija (modo no selectivo): uno o varios,
    // hace referencia a Saucers
    saucers: [{
        saucerId: { type: mongoose.Schema.Types.ObjectId, ref: "Saucers" }
    }],
    // Modo selectivo: en vez de platillos fijos, el admin define un conjunto
    // de opciones y cuántas puede elegir el cliente entre ellas (ej. "elige 1
    // taco entre: al pastor, de pollo, de carne")
    selective: { type: Boolean, default: false },
    selectiveOptions: [{
        saucerId: { type: mongoose.Schema.Types.ObjectId, ref: "Saucers" }
    }],
    // Cuántas opciones puede elegir el cliente cuando selective es true
    selectiveMaxPicks: { type: Number, default: 1 },
    // Política de bebidas: el admin no elige la bebida final, define qué
    // puede elegir el cliente al momento de ordenar. Se puede combinar:
    // conjuntos ya armados (conveniencia, no descuentan nada por sí mismos)
    // y/o bebidas individuales sueltas. Las bebidas son opcionales.
    drinkPolicy: {
        drinkSetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "DrinkSets" }],
        thirdPartyDrinkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drinks" }]
    },
    // Precio del combo
    price: { type: Number },
    // Breve descripción de lo que incluye
    description: { type: String },
    // Estado (ej. disponible, no disponible). Nace 'disponible' por default
    status: { type: String, default: "disponible" },
    // ID público de la imagen (usualmente para Cloudinary)
    publicId: { type: String }
},
{
    // Registra fecha de creación y actualización
    timestamps: true,
    strict: false
})

export default model("Combos", combosSchema)