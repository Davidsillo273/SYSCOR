import utils from "./validationsUtils.js";

const validateBirthdate = (birthdate) => {
  if (!birthdate) return { valid: false, message: "La fecha de nacimiento es requerida." };
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) {
    return { valid: false, message: "La fecha de nacimiento no es válida." };
  }
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  if (age < 14) {
    return { valid: false, message: "El cliente debe tener al menos 14 años." };
  }
  if (age > 120) {
    return { valid: false, message: "La fecha de nacimiento no es válida." };
  }
  return { valid: true };
};

const validateCardToken = (token) => {
  if (!token || typeof token !== "string" || !token.startsWith("tok_")) {
    return { valid: false, message: "El token de tarjeta no es válido." };
  }
  return { valid: true };
};

const validatePhones = (phones) => {
  if (!Array.isArray(phones) || phones.length === 0) {
    return { valid: false, message: "Se requiere al menos un número de teléfono." };
  }
  for (const phone of phones) {
    const result = utils.validatePhone(phone);
    if (!result.valid) return result;
  }
  return { valid: true };
};

export default {
  validateBirthdate,
  validateCardToken,
  validatePhones,
};