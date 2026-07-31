import { UNIT_LIST } from "../units/unitsUtils.js";

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

const ITEM_TYPES = ["producto", "activo_fijo"];

const validateItemType = (itemType) => {
  if (!itemType || !ITEM_TYPES.includes(itemType)) {
    return {
      valid: false,
      message: "El tipo de artículo debe ser 'producto' o 'activo_fijo'.",
    };
  }

  return { valid: true };
};

const PRODUCT_CATEGORIES = ["Aves", "Carnes", "Verduras", "Frutas", "Minerales", "Otros"];
const ASSET_CATEGORIES = ["Mobiliario", "Equipo de cocina", "Electrónica", "Utensilios", "Otros"];

// La categoría depende del itemType: un producto usa el catálogo de materia
// prima, un activo fijo usa el de mobiliario/equipo
const validateCategory = (type, itemType) => {
  const catalog = itemType === "activo_fijo" ? ASSET_CATEGORIES : PRODUCT_CATEGORIES;

  if (!type || !catalog.includes(type)) {
    return {
      valid: false,
      message: "La categoría debe ser una de: " + catalog.join(", "),
    };
  }

  return { valid: true };
};

const ASSET_CONDITIONS = ["Nuevo", "Bueno", "Regular", "Dañado", "De baja"];

// La condición física solo es obligatoria para activos fijos
const validateCondition = (condition, itemType) => {
  if (itemType !== "activo_fijo") return { valid: true };

  if (!condition || !ASSET_CONDITIONS.includes(condition)) {
    return {
      valid: false,
      message: "La condición debe ser una de: " + ASSET_CONDITIONS.join(", "),
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

// La unidad solo es obligatoria para productos (materia prima medible y
// descontable). Los activos fijos no la usan
const validateUnit = (unit, itemType) => {
  if (itemType === "activo_fijo") return { valid: true };

  if (!unit || !UNIT_LIST.includes(unit)) {
    return {
      valid: false,
      message: "La unidad debe ser una del catálogo válido.",
    };
  }

  return { valid: true };
};

export default {
  validateName,
  validatePrice,
  validateUbication,
  validateQuantity,
  validateItemType,
  validateCategory,
  validateCondition,
  validateStatus,
  validateUnit,
};
