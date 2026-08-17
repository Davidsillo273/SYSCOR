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
      // Código único que se genera la primera vez que el empleado tiene al
      // menos un permiso Y ya registró su propia contraseña. Se lo manda por
      // correo y lo usa en el login (junto con su contraseña) en vez de tener
      // que escribir su email cada vez, ver loginUtils.processLoginByAccessCode.
      accessCode: { type: String, default: null },
    },
    // Información laboral y salarial. AFP/ISSS/rent ya NO se piden al admin:
    // son descuentos de ley con porcentajes fijos, se calculan automáticamente
    // a partir del salario base (ver utils/users/payrollUtils.js) y aquí se
    // guarda el monto en dólares que resultó de ese cálculo, no un porcentaje.
    workInfo: {
      workInsurance: { type: Boolean, default: false }, // Seguro médico
      AFP: { type: Number, default: 0 }, // Descuento de AFP calculado (7.25% del salario)
      isss: { type: Number, default: 0 }, // Descuento de ISSS calculado (3%, tope $30)
      rent: { type: Number, default: 0 }, // Retención de ISR calculada según tabla de Hacienda
      salary: { type: Number, required: true }, // Sueldo base bruto
      additionalPay: { type: Number, default: 0 }, // Bonos extras
      isAuthorized: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "on_leave"],
        default: "active", // Estado actual en la empresa
      },
      shift: { type: String, default: null }, // Turno asignado (ej. "Mañana", "Tarde", "Noche")
      schedule: { type: String, default: null }, // Horario legible (ej. "8:00 AM - 4:00 PM")

      // Días que trabaja este empleado en la semana. Junto con el horario de
      // abajo, esto es lo que le permite al Dashboard saber si el empleado
      // está trabajando "en este momento" o no.
      workDays: {
        type: [String],
        enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
        default: [],
      },
      // Horario general, en formato 24h "HH:mm" (ej. "08:00" a "16:00")
      scheduleStart: { type: String, default: null },
      scheduleEnd: { type: String, default: null },
      // Si el admin quiere un horario distinto para sábado/domingo, lo activa
      // aquí y llena las horas de abajo; si no, el fin de semana usa el horario general.
      weekendScheduleEnabled: { type: Boolean, default: false },
      weekendScheduleStart: { type: String, default: null },
      weekendScheduleEnd: { type: String, default: null },
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