// Revisamos que el correo venga y que tenga una forma válida antes de aceptarlo
const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "El correo electrónico es requerido." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: "El correo electrónico no tiene un formato válido." };
  }
  return { valid: true };
};

// Nos aseguramos de que la contraseña cumpla las reglas mínimas de seguridad
const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "La contraseña es requerida." };
  }
  if (password.length < 8) {
    return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos una letra mayúscula." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos una letra minúscula." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos un número." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos un carácter especial." };
  }
  return { valid: true };
};

// Validación genérica de nombre/apellido, reutilizada por varios formularios
const validateName = (value, fieldName = "El campo") => {
  if (!value || typeof value !== "string" || value.trim().length < 2) {
    return { valid: false, message: `${fieldName} debe tener al menos 2 caracteres.` };
  }
  if (value.trim().length > 50) {
    return { valid: false, message: `${fieldName} no puede superar los 50 caracteres.` };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(value.trim())) {
    return { valid: false, message: `${fieldName} solo puede contener letras.` };
  }
  return { valid: true };
};

// El teléfono se valida con el formato de El Salvador (8 dígitos, con o sin +503)
const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return { valid: false, message: "El número de teléfono es requerido." };
  }
  const clean = phone.replace(/[\s\-]/g, "").replace(/^\+503/, "");
  if (!/^\d{8}$/.test(clean)) {
    return { valid: false, message: "El número de teléfono debe tener 8 dígitos (formato de El Salvador)." };
  }
  return { valid: true };
};

const validateAddress = (address) => {
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return { valid: false, message: "La dirección debe tener al menos 5 caracteres." };
  }
  return { valid: true };
};

// El código de verificación siempre es un hexadecimal de 6 caracteres (ver emailUtils.generateVerificationCode)
const validateVerificationCode = (code) => {
  if (!code || typeof code !== "string") {
    return { valid: false, message: "El código de verificación es requerido." };
  }
  if (!/^[A-Fa-f0-9]{6}$/.test(code.trim())) {
    return { valid: false, message: "El código de verificación no es válido." };
  }
  return { valid: true };
};

const validatePositiveNumber = (value, fieldName = "El valor") => {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: `${fieldName} debe ser un número positivo.` };
  }
  return { valid: true };
};

// Corre una lista de validaciones en orden y se detiene en la primera que falle
const runValidations = (validators) => {
  for (const fn of validators) {
    const result = fn();
    if (!result.valid) return result;
  }
  return { valid: true };
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateAddress,
  validateVerificationCode,
  validatePositiveNumber,
  runValidations,
};
