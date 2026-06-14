const validateName = (name) => {
  if (!name || typeof name !== "string") {
    return {
      valid: false,
      message: "El nombre es requerido.",
    };
  }

  if (name.trim().length < 3) {
    return {
      valid: false,
      message: "El nombre debe tener al menos 3 caracteres.",
    };
  }

  return { valid: true };
};

const validateCategory = (category) => {
  if (!category || typeof category !== "string") {
    return {
      valid: false,
      message: "La categoría es requerida.",
    };
  }

  return { valid: true };
};

const validatePrice = (price) => {
  if (price === undefined || price === null || price === "") {
    return {
      valid: false,
      message: "El precio es requerido.",
    };
  }

  return { valid: true };
};

const validateStatus = (status) => {
  if (!status || typeof status !== "string") {
    return {
      valid: false,
      message: "El estado es requerido.",
    };
  }

  const validStatus = ["Activo", "Inactivo"];

  if (!validStatus.includes(status)) {
    return {
      valid: false,
      message: "El estado debe ser Activo o Inactivo.",
    };
  }

  return { valid: true };
};

const validateImage = (file) => {
  if (!file) {
    return {
      valid: false,
      message: "La imagen es requerida.",
    };
  }

  return { valid: true };
};

export default {
  validateName,
  validateCategory,
  validatePrice,
  validateStatus,
  validateImage,
};