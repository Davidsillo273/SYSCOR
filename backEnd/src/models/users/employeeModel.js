import mongoose from "mongoose";

// Estructura de datos para un Empleado
const employeeSchema = new mongoose.Schema(
  {
    // Información personal y de contacto
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      duiNit: { type: String, required: true, trim: true }, // Documento de identidad (DUI o NIT)
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      image: { type: String, default: null },
      // Puesto de trabajo del empleado
      type: {
        type: String,
        required: true,
        enum: ["kitchen", "waiter", "cashier", "manager", "cleaner", "other"],
      },
    },
    // Datos para ingresar al sistema
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      isVerified: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      timeOut: { type: Date, default: null },
    },
    // Información laboral y salarial
    workInfo: {
      workInsurance: { type: Boolean, default: false }, // Seguro médico
      AFP: { type: Number, default: 0 }, // Fondo de pensiones
      rent: { type: Number, default: 0 }, // Retención de impuestos
      salary: { type: Number, required: true }, // Sueldo base
      additionalPay: { type: Number, default: 0 }, // Bonos extras
      isAuthorized: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "on_leave"],
        default: "active", // Estado actual en la empresa
      },
      shift: { type: String, default: null }, // Turno asignado (ej. "Mañana", "Tarde", "Noche")
      schedule: { type: String, default: null }, // Horario legible (ej. "8:00 AM - 4:00 PM")
    },
    // Permisos granulares específicos de este empleado (ej. "menu:create").
    // El admin los asigna al invitar o al editar el perfil del empleado.
    permissions: {
      type: [String],
      default: [],
    },
    // Sirve para forzar el cierre de sesión si un administrador
    // le cambia los permisos a este empleado mientras está conectado.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);