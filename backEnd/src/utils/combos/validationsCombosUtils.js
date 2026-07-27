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

// Ahora un combo puede tener uno o varios platillos
const validateSaucers = (saucers) => {
  if (!Array.isArray(saucers) || saucers.length === 0) {
    return {
      valid: false,
      message: "El combo debe incluir al menos un platillo.",
    };
  }

  return { valid: true };
};

const validateCategory = (category) => {
  if (!category || !["individual", "duo", "familiar"].includes(category)) {
    return {
      valid: false,
      message: "La categoría debe ser 'individual', 'duo' o 'familiar'.",
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

const validateQuantity = (quantity) => {
  if (quantity === undefined || quantity === null || quantity === "") {
    return {
      valid: false,
      message: "La cantidad es requerida.",
    };
  }

  return { valid: true };
};

const validateDescription = (description) => {
  if (!description || typeof description !== "string") {
    return {
      valid: false,
      message: "La descripción es requerida.",
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

export default {
  validateName,
  validateSaucers,
  validateCategory,
  validatePrice,
  validateQuantity,
  validateDescription,
  validateStatus,
  validateImage,
};