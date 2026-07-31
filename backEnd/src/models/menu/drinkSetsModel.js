// Un "conjunto de bebidas" es un atajo de conveniencia para el admin: agrupa
// varias bebidas de tercero que normalmente van juntas (ej. "La clásica" =
// Coca-Cola + Fanta + Sprite) para no tener que elegirlas una por una cada
// vez que arma un combo nuevo. A diferencia de una receta, NO descuenta
// inventario por sí mismo (las bebidas de tercero ya descuentan su propio
// stock cuando se venden sueltas).
import mongoose, { Schema, model } from "mongoose";

const drinkSetsSchema = new Schema(
  {
    name: { type: String },
    drinkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drinks" }],
    // Se deshabilita, nunca se elimina: si un combo ya lo estaba usando no
    // queremos que su referencia quede rota
    status: { type: String, enum: ["activo", "inactivo"], default: "activo" },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("DrinkSets", drinkSetsSchema);
