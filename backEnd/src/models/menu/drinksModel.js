import {Schema, model} from "mongoose"
import { UNIT_LIST } from "../../utils/units/unitsUtils.js"

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
    // Subcategoría para clasificar dentro de la categoría (alcohólica, lite, gaseosa, natural...)
    subcategory: { type: String },
    // Descripción libre de la bebida
    description: { type: String },
    // Cantidad en inventario. Solo aplica a bebidas 'tercero'
    quantity: { type: Number },
    // Estado (ej. disponible, inactiva)
    status: { type: String, default: "disponible" },
    // ID para identificar la imagen en la nube
    publicId: { type: String },
    // Receta opcional: solo tiene sentido para bebidas 'casa'. Los ingredientes
    // con tracked:true (ligados a un insumo real) SÍ descuentan inventario al
    // confirmarse una orden que use esta bebida dentro de un combo.
    recipe: [{
        // Nombre del ingrediente
        name: { type: String },
        // Si el ingrediente existe/se crea como insumo de Inventario
        tracked: { type: Boolean, default: false },
        // Referencia al insumo en Inventario (null si es un ingrediente "solo receta", ej. agua)
        inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", default: null },
        quantity: { type: Number },
        unit: { type: String, enum: UNIT_LIST }
    }]
},
{
    // Guarda las fechas de cuándo se creó o modificó
    timestamps: true,
    strict: false
})

export default model("Drinks", drinkSchema)