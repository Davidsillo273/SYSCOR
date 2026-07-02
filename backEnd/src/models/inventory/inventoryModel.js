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
    // Tipo o categoría de artículo (ej. bebida, ingrediente)
    type: {
        type: String
    },
    // Estado del artículo (ej. activo, inactivo)
    status: {
        type: String
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