import utils from "../validationsUsersUtils.js";

const validateBirthdate = (birthdate) => {
  if (!birthdate) return { valid: false, message: "Birthdate is required." };
  const date = new Date(birthdate);
  if (isNaN(date.getTime())) {
    return { valid: false, message: "Birthdate is invalid." };
  }
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  if (age < 14) {
    return { valid: false, message: "The customer must be at least 14 years old." };
  }
  if (age > 120) {
    return { valid: false, message: "Birthdate is invalid." };
  }
  return { valid: true };
};

const validateCardToken = (token) => {
  if (!token || typeof token !== "string" || !token.startsWith("tok_")) {
    return { valid: false, message: "Card token is invalid." };
  }
  return { valid: true };
};

const validatePhones = (phones) => {
  if (!Array.isArray(phones) || phones.length === 0) {
    return { valid: false, message: "At least one phone number is required." };
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