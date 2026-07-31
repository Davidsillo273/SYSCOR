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

export default { findByNameInsensitive };
