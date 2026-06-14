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

const validateSaucersId = (saucersId) => {
  if (!saucersId) {
    return {
      valid: false,
      message: "El platillo es requerido.",
    };
  }

  return { valid: true };
};

const validateDrinksId = (drinksId) => {
  if (!drinksId) {
    return {
      valid: false,
      message: "La bebida es requerida.",
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
  validateSaucersId,
  validateDrinksId,
  validatePrice,
  validateQuantity,
  validateDescription,
  validateStatus,
  validateImage,
};