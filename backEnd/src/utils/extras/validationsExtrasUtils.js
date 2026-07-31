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

const validateStatus = (status) => {
  if (!status || typeof status !== "string") {
    return {
      valid: false,
      message: "El estado es requerido.",
    };
  }

  return { valid: true };
};

// La imagen es opcional: si no se manda, el frontend usa un placeholder
const validateImage = () => ({ valid: true });

// Si el extra depende de insumos de inventario, necesita al menos un ingrediente
const validateIngredients = (ingredients, isCompound) => {
  if (!isCompound) return { valid: true };

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return {
      valid: false,
      message: "Este extra depende de insumos: agrega al menos un ingrediente.",
    };
  }

  return { valid: true };
};

export default {
  validateName,
  validatePrice,
  validateStatus,
  validateImage,
  validateIngredients,
};