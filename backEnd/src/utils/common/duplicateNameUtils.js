// Util compartido para detectar nombres repetidos (sin importar mayúsculas/
// minúsculas ni acentos) al crear cualquier ítem del menú o del inventario.
// Nunca bloquea la creación: solo informa si ya existe algo con ese nombre
// para que el admin decida si edita lo existente o crea de todas formas.
export const findByNameInsensitive = async (model, name, excludeId = null) => {
  if (!name || typeof name !== "string" || !name.trim()) return null;

  const filter = { name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" } };
  if (excludeId) filter._id = { $ne: excludeId };

  try {
    return await model.findOne(filter);
  } catch (error) {
    console.error("duplicateNameUtils.findByNameInsensitive:", error);
    return null;
  }
};

// Escapa caracteres especiales de regex para que un nombre con paréntesis,
// puntos, etc. no rompa la búsqueda
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Validación de "nombre" compartida por todos los ítems de menú (combos,
// bebidas, extras, platillos, conjuntos de bebidas). Antes estaba copiada y
// pegada en cada utils de validación de menú (validationsCombosUtils,
// validationsDrinksUtils, validationsExtrasUtils, validationsSaucersUtils) y
// además en línea dentro de drinkSetsController; se centraliza acá para que
// un cambio en la regla (ej. el mínimo de caracteres) no haya que replicarlo
// en cinco lugares distintos.
export const validateItemName = (name) => {
  if (!name || typeof name !== "string") {
    return { valid: false, message: "El nombre es requerido." };
  }
  if (name.trim().length < 3) {
    return { valid: false, message: "El nombre debe tener al menos 3 caracteres." };
  }
  return { valid: true };
};

// Validación de "precio" compartida por los mismos ítems de menú: solo exige
// que venga presente (el signo/formato numérico ya lo garantiza el schema).
export const validateItemPrice = (price) => {
  if (price === undefined || price === null || price === "") {
    return { valid: false, message: "El precio es requerido." };
  }
  return { valid: true };
};

export default { findByNameInsensitive, validateItemName, validateItemPrice };
