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

const validatePrice = (price) => {
  if (price === undefined || price === null || price === "") {
    return {
      valid: false,
      message: "El precio es requerido.",
    };
  }

  return { valid: true };
};

// La cantidad solo es obligatoria para bebidas 'tercero' (las de casa no llevan stock propio)
const validateQuantity = (quantity, category) => {
  if (category !== "tercero") return { valid: true };

  if (quantity === undefined || quantity === null || quantity === "") {
    return {
      valid: false,
      message: "La cantidad es requerida para bebidas de tercero.",
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

  return { valid: true };
};

const validateCategory = (category) => {
  if (!category || !["casa", "tercero"].includes(category)) {
    return {
      valid: false,
      message: "La categoría debe ser 'casa' o 'tercero'.",
    };
  }

  return { valid: true };
};

// La imagen es opcional: si no se manda, el frontend usa un placeholder
const validateImage = () => ({ valid: true });

export default {
  validateName,
  validatePrice,
  validateQuantity,
  validateStatus,
  validateCategory,
  validateImage,
};