import mongoose, { Schema, model } from "mongoose";

// Registro de asistencia: una entrada por cada día que un empleado marca su
// llegada. Se guarda el horario esperado (snapshot de workInfo.scheduleStart
// al momento de marcar) para que si el admin cambia el horario después, el
// historial ya generado no se recalcule con datos nuevos.
const attendanceSchema = new Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // Día normalizado a medianoche (sin hora), usado para encontrar "la
    // asistencia abierta de hoy" sin ambigüedad de zona horaria dentro del día.
    workDate: { type: Date, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    expectedStart: { type: String, default: null }, // snapshot "HH:mm"
    status: {
      type: String,
      enum: ["early", "on_time", "late"],
      required: true,
    },
    lateMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Una sola asistencia abierta por empleado y día
attendanceSchema.index({ employee: 1, workDate: 1 }, { unique: true });

export default model("Attendance", attendanceSchema);
