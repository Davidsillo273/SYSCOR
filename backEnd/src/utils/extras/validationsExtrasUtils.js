// Nombre y precio son reglas idénticas en todos los ítems de menú, ver
// utils/common/duplicateNameUtils.js para la implementación compartida.
import { validateItemName, validateItemPrice } from "../common/duplicateNameUtils.js";

const validateName = validateItemName;
const validatePrice = validateItemPrice;

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