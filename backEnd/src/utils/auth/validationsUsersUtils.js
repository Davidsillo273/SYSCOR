const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: "Email does not have a valid format." };
  }
  return { valid: true };
};

const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character." };
  }
  return { valid: true };
};

const validateName = (value, fieldName = "Field") => {
  if (!value || typeof value !== "string" || value.trim().length < 2) {
    return { valid: false, message: `${fieldName} must be at least 2 characters long.` };
  }
  if (value.trim().length > 50) {
    return { valid: false, message: `${fieldName} cannot exceed 50 characters.` };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(value.trim())) {
    return { valid: false, message: `${fieldName} can only contain letters.` };
  }
  return { valid: true };
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return { valid: false, message: "Phone number is required." };
  }
  const clean = phone.replace(/[\s\-]/g, "").replace(/^\+503/, "");
  if (!/^\d{8}$/.test(clean)) {
    return { valid: false, message: "Phone number must be 8 digits long (El Salvador format)." };
  }
  return { valid: true };
};

const validateAddress = (address) => {
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return { valid: false, message: "Address must be at least 5 characters long." };
  }
  return { valid: true };
};

const validateVerificationCode = (code) => {
  if (!code || typeof code !== "string") {
    return { valid: false, message: "Verification code is required." };
  }
  if (!/^[A-Fa-f0-9]{6}$/.test(code.trim())) {
    return { valid: false, message: "Verification code is invalid." };
  }
  return { valid: true };
};

const validatePositiveNumber = (value, fieldName = "Value") => {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: `${fieldName} must be a positive number.` };
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