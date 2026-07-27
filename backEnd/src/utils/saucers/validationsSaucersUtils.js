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

const SAUCER_CATEGORIES = ["Burritos", "Tortas", "Tacos", "Sopas", "Especiales"];

const validateCategory = (category) => {
  if (!category || !SAUCER_CATEGORIES.includes(category)) {
    return {
      valid: false,
      message: "La categoría debe ser una de: " + SAUCER_CATEGORIES.join(", "),
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

// La imagen es opcional: si no se manda, el frontend usa un placeholder
const validateImage = () => ({ valid: true });

export default {
  validateName,
  validateCategory,
  validatePrice,
  validateStatus,
  validateImage,
};