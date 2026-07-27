// Importamos mongoose para interactuar con la base de datos
import {Schema, model} from "mongoose"

// Unidades de medida más comunes para describir cantidades de una receta
const RECIPE_UNITS = ["unidad", "g", "kg", "ml", "l", "cucharadita", "cucharada", "taza", "vaso", "pizca"];

// Definimos la estructura de datos para las Bebidas (Drinks)
const drinkSchema = new Schema({
    // Enlace a la foto de la bebida (opcional: si no hay, el front usa un placeholder)
    image: { type: String },
    // Nombre de la bebida
    name: { type: String },
    // Precio de venta
    price: { type: Number },
    // 'casa' = se prepara en el local (sin stock propio, puede tener receta)
    // 'tercero' = se compra ya embotellada/enlatada (sí lleva stock)
    category: { type: String, enum: ["casa", "tercero"] },
    // Subcategoría libre para clasificar dentro de la categoría (alcohólica, lite, gaseosa, natural...)
    subcategory: { type: String },
    // Cantidad en inventario. Solo aplica a bebidas 'tercero'
    quantity: { type: Number },
    // Estado (ej. disponible, inactiva)
    status: { type: String, default: "disponible" },
    // ID para identificar la imagen en la nube
    public_id: { type: String },
    // Receta opcional: solo tiene sentido para bebidas 'casa'. No descuenta inventario,
    // es puramente informativo para saber cómo se prepara la bebida.
    recipe: [{
        // Nombre del ingrediente
        name: { type: String },
        // Si el ingrediente existe/se crea como insumo de Inventario
        tracked: { type: Boolean, default: false },
        // Referencia al insumo en Inventario (null si es un ingrediente "solo receta", ej. agua)
        inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", default: null },
        // String para admitir medidas como "1/2", "una pizca", etc.
        quantity: { type: String },
        unit: { type: String, enum: RECIPE_UNITS }
    }]
},
{
    // Guarda las fechas de cuándo se creó o modificó
    timestamps: true,
    strict: false
})

export default model("Drinks", drinkSchema)