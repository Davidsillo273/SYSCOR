const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "El correo es requerido." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: "El correo no tiene un formato válido." };
  }
  return { valid: true };
};

const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "La contraseña es requerida." };
  }
  if (password.length < 8) {
    return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "La contraseña debe tener al menos una letra mayúscula." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "La contraseña debe tener al menos una letra minúscula." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "La contraseña debe tener al menos un número." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "La contraseña debe tener al menos un carácter especial." };
  }
  return { valid: true };
};

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

const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return { valid: false, message: "El teléfono es requerido." };
  }
  const clean = phone.replace(/[\s\-\+503]/g, "");
  if (!/^\d{8}$/.test(clean)) {
    return { valid: false, message: "El teléfono debe tener 8 dígitos (formato El Salvador)." };
  }
  return { valid: true };
};

const validateAddress = (address) => {
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return { valid: false, message: "La dirección debe tener al menos 5 caracteres." };
  }
  return { valid: true };
};

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