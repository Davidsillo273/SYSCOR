import { Schema, model } from "mongoose"
import { UNIT_LIST } from "../../utils/units/unitsUtils.js"

// Definimos el "esqueleto" o estructura que tendrá cada artículo del inventario.
// Inventario ahora se divide en dos categorías principales:
//   - "producto": materia prima/mercancía que se consume y descuenta stock
//     (carnes, verduras, bebidas embotelladas, etc.)
//   - "activo_fijo": mobiliario/equipo del local (mesas, sillas, electrónica...),
//     no se descuenta por recetas, solo se controla su cantidad y estado.
const inventorySchema = new Schema({
    // Nombre del artículo
    name: {
        type: String
    },
    // Categoría principal: producto de consumo o activo fijo
    itemType: {
        type: String,
        enum: ["producto", "activo_fijo"],
        default: "producto"
    },
    // Foto del artículo (opcional: si no hay, el front usa un placeholder)
    image: { type: String },
    // ID de la imagen en Cloudinary
    publicId: { type: String },
    // Precio unitario (producto) o valor de adquisición (activo fijo)
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
    // Categoría dentro de su itemType: para "producto" son las categorías de
    // materia prima (Aves, Carnes...); para "activo_fijo" son categorías de
    // mobiliario/equipo (Mobiliario, Electrónica...). Se valida en el
    // controlador según itemType, no aquí, para no mezclar dos catálogos en un enum.
    type: {
        type: String
    },
    // Estado del artículo (ej. disponible, agotado — producto; o condición
    // física — activo fijo, ver "condition")
    status: {
        type: String
    },
    // Condición física. Solo aplica a activos fijos
    condition: {
        type: String,
        enum: ["Nuevo", "Bueno", "Regular", "Dañado", "De baja"]
    },
    // Fecha de adquisición. Solo aplica a activos fijos (opcional)
    acquisitionDate: {
        type: Date
    },
    // Unidad en la que se mide. Solo aplica a "producto" (para recetas de
    // bebidas/platillos/extras y el descuento automático de inventario)
    unit: {
        type: String,
        enum: UNIT_LIST
    },
    // true cuando el insumo se creó al vuelo desde el builder de receta de una
    // bebida/platillo/extra (solo con nombre + unidad) y todavía le falta
    // precio/ubicación/categoría reales
    pending: {
        type: Boolean,
        default: false
    },
    // Umbral de alerta propio de este insumo. Si no se define, se usa el
    // umbral general de la sección (Ajustes > Inventario). Solo aplica a "producto"
    lowStockAlert: {
        type: Number
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
