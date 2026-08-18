import AttendanceModel from "../../models/attendance/attendanceModel.js";
import EmployeeModel from "../../models/users/employeeModel.js";

const attendanceController = {};

const WEEKEND_DAYS = [0, 6]; // domingo, sábado (Date#getDay())

// Medianoche del día de "now", para agrupar la asistencia por día calendario
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Determina qué horario aplica hoy (general o de fin de semana, si está
// habilitado) y lo devuelve en minutos desde medianoche para poder comparar.
const getExpectedStartMinutes = (workInfo, now) => {
  const isWeekend = WEEKEND_DAYS.includes(now.getDay());
  const useWeekend = isWeekend && workInfo.weekendScheduleEnabled;

  const scheduleStart = useWeekend ? workInfo.weekendScheduleStart : workInfo.scheduleStart;
  if (!scheduleStart) return null;

  const [hh, mm] = scheduleStart.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  return { minutes: hh * 60 + mm, label: scheduleStart };
};

// Marca la entrada del empleado autenticado. Solo una vez por día: si ya
// existe una asistencia para hoy, se rechaza (409) para no pisar el registro.
attendanceController.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await EmployeeModel.findById(employeeId).select("workInfo");
    if (!employee) {
      return res.status(404).json({ title: "Empleado no encontrado", message: "No se encontró tu ficha de empleado." });
    }

    const now = new Date();
    const workDate = startOfDay(now);

    const existing = await AttendanceModel.findOne({ employee: employeeId, workDate });
    if (existing) {
      return res.status(409).json({ title: "Ya marcaste entrada", message: "Ya registraste tu entrada de hoy." });
    }

    const expected = getExpectedStartMinutes(employee.workInfo, now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let status = "on_time";
    let lateMinutes = 0;

    if (expected) {
      const diff = nowMinutes - expected.minutes;
      if (diff > 0) {
        status = "late";
        lateMinutes = diff;
      } else if (diff < 0) {
        status = "early";
      }
    }

    const attendance = await AttendanceModel.create({
      employee: employeeId,
      workDate,
      checkIn: now,
      expectedStart: expected?.label || null,
      status,
      lateMinutes,
    });

    return res.status(201).json({ title: "Entrada registrada", message: "Tu entrada quedó registrada.", data: attendance });
  } catch (error) {
    console.error("attendanceController.checkIn:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Marca la salida del empleado autenticado, cerrando la asistencia abierta de hoy.
attendanceController.checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const workDate = startOfDay(new Date());

    const attendance = await AttendanceModel.findOne({ employee: employeeId, workDate });
    if (!attendance) {
      return res.status(404).json({ title: "Sin entrada registrada", message: "Todavía no marcas tu entrada de hoy." });
    }
    if (attendance.checkOut) {
      return res.status(409).json({ title: "Ya marcaste salida", message: "Ya registraste tu salida de hoy." });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    return res.status(200).json({ title: "Salida registrada", message: "Tu salida quedó registrada.", data: attendance });
  } catch (error) {
    console.error("attendanceController.checkOut:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Historial paginado del propio empleado, más reciente primero.
attendanceController.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      AttendanceModel.find({ employee: employeeId }).sort({ workDate: -1 }).skip(skip).limit(limit),
      AttendanceModel.countDocuments({ employee: employeeId }),
    ]);

    return res.status(200).json({
      records,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("attendanceController.getMyAttendance:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Estado de hoy del empleado autenticado (o null si aún no marca entrada),
// para que la pantalla de Inicio sepa si mostrar "Marcar entrada" o "Marcar salida".
attendanceController.getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const workDate = startOfDay(new Date());

    const attendance = await AttendanceModel.findOne({ employee: employeeId, workDate });
    return res.status(200).json({ data: attendance || null });
  } catch (error) {
    console.error("attendanceController.getTodayStatus:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

export default attendanceController;
