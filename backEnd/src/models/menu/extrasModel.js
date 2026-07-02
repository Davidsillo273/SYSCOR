// Importamos la herramienta para crear el modelo en la base de datos
import {Schema, model} from 'mongoose';

// Definimos la estructura para los Extras (adicionales al menú)
const extraSchema = new Schema({
    // Nombre del extra
    name: { type: String },
    // Costo adicional
    price: { type: Number },
    // Si está disponible o no
    status: { type: String }
},{
    // Para saber cuándo se añadió al sistema
    timestamps: true,
    strict: false
})
export default model("Extras", extraSchema)