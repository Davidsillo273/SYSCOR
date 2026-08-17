// Conjuntos de bebidas: agrupaciones de conveniencia que el admin arma una
// vez y luego reutiliza al crear combos, en vez de elegir bebida por bebida.
// Se pueden deshabilitar pero nunca eliminar: si un combo ya usaba el
// conjunto, no queremos que su referencia quede rota.
import DrinkSetsModel from "../../models/menu/drinkSetsModel.js";
import { findByNameInsensitive, validateItemName } from "../../utils/common/duplicateNameUtils.js";

const drinkSetsController = {};

// Trae todos los conjuntos (activos e inactivos), para la pantalla de administración
drinkSetsController.getAllDrinkSets = async (req, res) => {
  try {
    const sets = await DrinkSetsModel.find().sort({ createdAt: -1 }).populate("drinkIds");
    return res.status(200).json(sets);
  } catch (error) {
    console.error("drinkSetsController.getAllDrinkSets:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Solo los activos: se usa al armar un combo, no en la pantalla de administración
drinkSetsController.getActiveDrinkSets = async (req, res) => {
  try {
    const sets = await DrinkSetsModel.find({ status: "activo" }).sort({ createdAt: -1 }).populate("drinkIds");
    return res.status(200).json(sets);
  } catch (error) {
    console.error("drinkSetsController.getActiveDrinkSets:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Busca si ya existe un conjunto con ese nombre (sugerencia, no bloqueo)
drinkSetsController.checkName = async (req, res) => {
  try {
    const existing = await findByNameInsensitive(DrinkSetsModel, req.query.name);
    return res.status(200).json({ existing: existing || null });
  } catch (error) {
    console.error("drinkSetsController.checkName:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Crea un nuevo conjunto de bebidas (nace activo por default en el schema)
drinkSetsController.insertDrinkSet = async (req, res) => {
  try {
    const { name, drinkIds } = req.body;

    const nameValidation = validateItemName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ title: "Nombre inválido", message: nameValidation.message });
    }
    if (!Array.isArray(drinkIds) || drinkIds.length === 0) {
      return res.status(400).json({ title: "Bebidas requeridas", message: "Selecciona al menos una bebida para el conjunto." });
    }

    const newSet = new DrinkSetsModel({ name, drinkIds });
    await newSet.save();

    return res.status(201).json({ title: "Conjunto creado", message: "El conjunto de bebidas se guardó correctamente.", newSet });
  } catch (error) {
    console.error("drinkSetsController.insertDrinkSet:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Actualiza nombre y/o bebidas de un conjunto existente, y opcionalmente su estado
drinkSetsController.updateDrinkSet = async (req, res) => {
  try {
    const { name, drinkIds, status } = req.body;

    const nameValidation = validateItemName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ title: "Nombre inválido", message: nameValidation.message });
    }
    if (!Array.isArray(drinkIds) || drinkIds.length === 0) {
      return res.status(400).json({ title: "Bebidas requeridas", message: "Selecciona al menos una bebida para el conjunto." });
    }

    // El estado es opcional aquí y solo se aplica si viene un valor reconocido:
    // esta ruta también se usa para simplemente editar nombre/bebidas sin tocar el estado
    const updatedData = { name, drinkIds };
    if (status && ["activo", "inactivo"].includes(status)) {
      updatedData.status = status;
    }

    const updatedSet = await DrinkSetsModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedSet) {
      return res.status(404).json({ title: "Conjunto no encontrado", message: "No se encontró el conjunto de bebidas solicitado." });
    }

    return res.status(200).json({ title: "Conjunto actualizado", message: "El conjunto de bebidas se actualizó correctamente.", updatedSet });
  } catch (error) {
    console.error("drinkSetsController.updateDrinkSet:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Deshabilita/habilita un conjunto sin tocar su nombre ni bebidas
drinkSetsController.toggleDrinkSetStatus = async (req, res) => {
  try {
    const set = await DrinkSetsModel.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ title: "Conjunto no encontrado", message: "No se encontró el conjunto de bebidas solicitado." });
    }

    set.status = set.status === "activo" ? "inactivo" : "activo";
    await set.save();

    return res.status(200).json({ title: "Estado actualizado", message: "El estado del conjunto se actualizó correctamente.", updatedSet: set });
  } catch (error) {
    console.error("drinkSetsController.toggleDrinkSetStatus:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

export default drinkSetsController;
