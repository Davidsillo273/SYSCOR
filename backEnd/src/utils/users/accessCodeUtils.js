// Genera y envía el "código de acceso" la primera vez que un empleado tiene
// al menos un permiso asignado (y ya tiene contraseña propia, lo cual es
// siempre cierto para un Employee ya guardado en la base). Se usa tanto al
// aceptar una invitación con permisos precargados como al editar permisos de
// un empleado ya existente desde Empleados.
import emailUtils from "../auth/emailUtils.js";

// Asegura que el código generado no choque con uno existente (poquísimo
// probable con 6 caracteres hex, pero se revisa igual).
const generateUniqueAccessCode = async (EmployeeModel) => {
  let code;
  let exists = true;
  while (exists) {
    code = emailUtils.generateVerificationCode();
    exists = await EmployeeModel.exists({ "loginInfo.accessCode": code });
  }
  return code;
};

// Si el empleado ya tenía código, no se genera uno nuevo (evita invalidar el
// que ya le llegó por correo cada vez que el admin ajusta sus permisos).
// Devuelve true si se generó y envió un código nuevo.
export const ensureAccessCodeIfNeeded = async (EmployeeModel, employeeDoc) => {
  const hasPermissions = Array.isArray(employeeDoc.permissions) && employeeDoc.permissions.length > 0;
  const alreadyHasCode = !!employeeDoc.loginInfo?.accessCode;

  if (!hasPermissions || alreadyHasCode) return false;

  const code = await generateUniqueAccessCode(EmployeeModel);
  employeeDoc.loginInfo.accessCode = code;
  await employeeDoc.save();

  await emailUtils.sendEmail(
    employeeDoc.loginInfo.email,
    "Código de acceso - SYSCOR",
    emailUtils.htmlAccessCodeEmail(code)
  );

  return true;
};

export default { ensureAccessCodeIfNeeded };
