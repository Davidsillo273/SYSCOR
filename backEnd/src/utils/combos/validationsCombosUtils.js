// Nombre y precio son reglas idénticas en todos los ítems de menú, ver
// utils/common/duplicateNameUtils.js para la implementación compartida.
import { validateItemName, validateItemPrice } from "../common/duplicateNameUtils.js";

const validateName = validateItemName;

// En modo normal el combo trae uno o varios platillos fijos. En modo
// selectivo, en cambio, lo que debe traer al menos una opción es
// selectiveOptions (los platillos fijos no aplican)
const validateSaucers = (saucers, selective, selectiveOptions) => {
  if (selective) {
    if (!Array.isArray(selectiveOptions) || selectiveOptions.length === 0) {
      return {
        valid: false,
        message: "En modo selectivo debes elegir al menos un platillo como opción.",
      };
    }
    return { valid: true };
  }

  if (!Array.isArray(saucers) || saucers.length === 0) {
    return {
      valid: false,
      message: "El combo debe incluir al menos un platillo.",
    };
  }

  return { valid: true };
};

// Cuántas opciones puede elegir el cliente en modo selectivo: al menos 1 y
// nunca más de las opciones disponibles
const validateSelectiveMaxPicks = (selective, maxPicks, optionsCount) => {
  if (!selective) return { valid: true };

  const picks = Number(maxPicks);
  if (!picks || picks < 1) {
    return {
      valid: false,
      message: "Indica cuántas opciones puede elegir el cliente (mínimo 1).",
    };
  }
  if (picks > optionsCount) {
    return {
      valid: false,
      message: "El cliente no puede elegir más opciones de las que ofreces.",
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

const validatePrice = validateItemPrice;

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
  validateSelectiveMaxPicks,
  validateCategory,
  validatePrice,
  validateDescription,
  validateStatus,
  validateImage,
};