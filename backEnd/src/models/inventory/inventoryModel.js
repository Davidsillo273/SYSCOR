// Importamos las herramientas de Mongoose para definir cómo se guardarán los datos en la base de datos
import {Schema, model} from "mongoose"

// Definimos el "esqueleto" o estructura que tendrá cada artículo del inventario
const inventorySchema = new Schema({
    // Nombre del artículo
    name: {
        type: String
    },
    // Precio del artículo
    price:{
        type: Number
    },
    // Ubicación física del artículo en el almacén o local
    ubication:{
        type: String
    },
    // Cantidad disponible en existencia
    quantity:{
        type: Number
    },
    // Categoría fija del insumo, usada también para filtrar ingredientes al
    // armar recetas de bebidas/platillos
    type: {
        type: String,
        enum: ["Aves", "Carnes", "Verduras", "Frutas", "Minerales", "Otros"]
    },
    // Estado del artículo (ej. activo, inactivo)
    status: {
        type: String
    },
    // Unidad en la que se mide (para insumos usados en recetas de bebidas)
    unit: {
        type: String,
        enum: ["unidad", "g", "kg", "ml", "l", "cucharadita", "cucharada", "taza", "vaso", "pizca"]
    },
    // true cuando el insumo se creó al vuelo desde el builder de receta de una
    // bebida (solo con nombre + unidad) y todavía le falta precio/ubicación/tipo reales
    pending: {
        type: Boolean,
        default: false
    }
},
{
    // Habilita la creación automática de las fechas de cuándo se creó y cuándo se actualizó por última vez
    timestamps: true,
    // Al ser strict: false, permite guardar campos adicionales que no estén definidos arriba
    strict: false
})

// Exportamos el modelo para poder usarlo y hacer consultas en la base de datos
export default model("Inventory", inventorySchema)