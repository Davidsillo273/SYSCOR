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

const validateUbication = (ubication) => {
  if (!ubication || typeof ubication !== "string") {
    return {
      valid: false,
      message: "La ubicación es requerida.",
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

const INVENTORY_CATEGORIES = ["Aves", "Carnes", "Verduras", "Frutas", "Minerales", "Otros"];

const validateType = (type) => {
  if (!type || !INVENTORY_CATEGORIES.includes(type)) {
    return {
      valid: false,
      message: "El tipo debe ser uno de: " + INVENTORY_CATEGORIES.join(", "),
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

export default {
  validateName,
  validatePrice,
  validateUbication,
  validateQuantity,
  validateType,
  validateStatus,
};