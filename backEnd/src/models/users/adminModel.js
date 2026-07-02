// Importamos mongoose para modelar los datos
import mongoose, { Schema, model } from "mongoose";

// Definimos el perfil de un Administrador
const adminSchema = new Schema(
  {
    // Información personal básica
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      image: { type: String, default: null },
    },
    // Datos de acceso al sistema
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true }, // Contraseña encriptada
      isVerified: { type: Boolean, default: false }, // ¿Ya verificó su correo?
      loginAttempts: { type: Number, default: 0 }, // Para evitar ataques de fuerza bruta
      timeOut: { type: Date, default: null }, // Si se bloqueó, hasta cuándo
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

export default model("Admin", adminSchema);