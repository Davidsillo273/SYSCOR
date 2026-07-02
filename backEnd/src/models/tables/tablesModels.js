// Importamos mongoose
import { Schema, model } from 'mongoose';

// Definimos la estructura para las Mesas del restaurante
const tableSchema = new Schema({
    // Número identificador de la mesa
    number: { type: Number },
    // Estado actual (ej. libre, ocupada, reservada)
    status: { type: String }
}, {
    // Guarda cuándo se creó o cambió
    timestamps: true,
    strict: false
});

// Exportamos el modelo para usarlo en controladores
export default model("Tables", tableSchema);