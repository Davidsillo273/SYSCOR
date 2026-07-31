import mongoose, { Schema, model } from "mongoose";

const orderItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ['combo', 'extra', 'drink'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType' // 'combo' -> Combos, 'extra' -> Extras, 'drink' -> Drinks
  },
  name: String,   // snapshot del nombre
  price: Number,  // snapshot del precio
  quantity: { type: Number, default: 1 },
  notes: String   // ej: "sin cebolla"
});

const orderSchema = new Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  items: [orderItemSchema],
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

export default model("Order", orderSchema);