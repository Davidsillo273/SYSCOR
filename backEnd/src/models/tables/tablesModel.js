import { Schema, model } from 'mongoose';

const tableSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  status: {
    type: String,
    enum: ['libre', 'ocupada', 'limpieza', 'reservada'],
    default: 'libre'
  }
}, {
  timestamps: true,
  strict: false
});

export default model("Tables", tableSchema);