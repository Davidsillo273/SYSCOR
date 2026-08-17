// Nombre y precio son reglas idénticas en todos los ítems de menú, ver
// utils/common/duplicateNameUtils.js para la implementación compartida.
import { validateItemName, validateItemPrice } from "../common/duplicateNameUtils.js";

const validateName = validateItemName;
const validatePrice = validateItemPrice;

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

// La receta solo tiene sentido (y es obligatoria) para bebidas 'casa'
const validateRecipe = (recipe, category) => {
  if (category !== "casa") return { valid: true };

  if (!Array.isArray(recipe) || recipe.length === 0) {
    return {
      valid: false,
      message: "La receta es obligatoria para bebidas de casa: agrega al menos un ingrediente.",
    };
  }

  return { valid: true };
};

export default {
  validateName,
  validatePrice,
  validateQuantity,
  validateStatus,
  validateCategory,
  validateImage,
  validateRecipe,
};