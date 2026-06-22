import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      DUI_NIT: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      image: { type: String, default: null },
      type: {
        type: String,
        required: true,
        enum: ["kitchen", "waiter", "cashier", "manager", "cleaner", "other"],
      },
    },
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      isVerified: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      timeOut: { type: Date, default: null },
    },
    workInfo: {
      workInsurance: { type: Boolean, default: false },
      AFP: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      salary: { type: Number, required: true },
      additionalPay: { type: Number, default: 0 },
      isAuthorized: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "on_leave"],
        default: "active",
      },
    },
    // Permisos granulares específicos de este empleado (ej. "menu:create").
    // El admin los asigna al invitar o al editar el perfil del empleado.
    // Validado contra el catálogo oficial en utils/permissionsCatalog.js
    permissions: {
      type: [String],
      default: [],
    },
    // Se incrementa cada vez que el admin modifica los permisos de este
    // empleado. El JWT lleva una "foto" de este número al momento del
    // login; si no coincide con el valor actual en la DB, la sesión se
    // considera vieja y se rechaza — obligando a un nuevo login que trae
    // los permisos actualizados.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);