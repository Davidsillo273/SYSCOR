// Registro de cada descuento (o intento de descuento) de inventario, sin
// importar de dónde venga: creación de un insumo compuesto, un extra pedido,
// o una orden confirmada en cocina. Sirve para auditar de dónde salió cada
// movimiento de stock.
import mongoose, { Schema, model } from "mongoose";

const inventoryLogSchema = new Schema({
    // Insumo afectado
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true
    },
    // Qué se hizo (por ahora siempre "deduct", se deja abierto por si a futuro
    // se registran también reabastecimientos)
    action: {
        type: String,
        default: "deduct"
    },
    // Cantidad descontada, en la unidad en la que se pidió el descuento
    quantity: { type: Number },
    unit: { type: String },
    // Esa misma cantidad ya convertida a la unidad base del insumo (la que
    // realmente se restó de su stock)
    quantityInBase: { type: Number },
    // Stock del insumo justo después de este movimiento
    resultingStock: { type: Number },
    // De dónde vino el consumo
    origin: {
        type: String,
        enum: ["order", "extra", "compound_creation", "manual"]
    },
    // Id del documento que originó el descuento (orden, extra, insumo compuesto)
    originId: { type: mongoose.Schema.Types.ObjectId },
    // Quién lo hizo (si había sesión identificada)
    operatorId: { type: mongoose.Schema.Types.ObjectId },
    operatorName: { type: String }
}, {
    timestamps: true,
    strict: false
});

export default model("InventoryLogs", inventoryLogSchema);
