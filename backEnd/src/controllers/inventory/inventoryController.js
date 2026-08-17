// Importamos el modelo de inventario y la utilidad que valida los datos
import InventoryModel from "../../models//inventory/inventoryModel.js";
import validationsInventory from "../../utils/inventory/validationsInventoryUtils.js";
// Utilidades para registrar movimientos y para leer el umbral de stock bajo configurado
import notificationUtils from "../../utils/notifications/notificationUtils.js";
import { notifyIfLowStock, disableDependentSaucers } from "../../utils/inventory/deductionUtils.js";
import { v2 as cloudinary } from "cloudinary";
import { convert } from "../../utils/units/unitsUtils.js";
import { findByNameInsensitive } from "../../utils/common/duplicateNameUtils.js";

const inventoryController = {};

// Busca si ya existe un insumo con ese nombre (sin distinguir mayúsculas).
// No bloquea nada: el front decide si edita el existente o crea de todas formas.
inventoryController.checkName = async (req, res) => {
  try {
    const existing = await findByNameInsensitive(InventoryModel, req.query.name);
    return res.status(200).json({ existing: existing || null });
  } catch (error) {
    console.error("inventoryController.checkName:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Revisa, sin descontar nada todavía, si el stock actual de cada ingrediente
// de una receta alcanza para la cantidad declarada. La usa Extras antes de
// confirmar la creación de un extra compuesto, para poder avisar qué falta.
inventoryController.checkRecipeStock = async (req, res) => {
  try {
    const recipe = Array.isArray(req.body.recipe) ? req.body.recipe : [];
    const missing = [];

    for (const item of recipe) {
      if (!item.tracked || !item.inventoryId) continue; // ingrediente "solo receta"

      const insumo = await InventoryModel.findById(item.inventoryId);
      if (!insumo) {
        missing.push({ ingredientId: item.inventoryId, name: item.name, reason: "No existe" });
        continue;
      }

      try {
        const needed = convert(item.quantity, item.unit, insumo.unit);
        const available = Number(insumo.quantity) || 0;
        if (available < needed) {
          missing.push({
            ingredientId: insumo._id,
            name: insumo.name,
            available,
            needed,
            unit: insumo.unit,
          });
        }
      } catch (conversionError) {
        missing.push({ ingredientId: insumo._id, name: insumo.name, reason: conversionError.message });
      }
    }

    return res.status(200).json({ missing });
  } catch (error) {
    console.error("inventoryController.checkRecipeStock:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Obtiene todos los productos registrados en el inventario.
// ?pending=true filtra solo los insumos creados al vuelo que faltan por completar
// ?itemType=producto|activo_fijo filtra por la categoría principal
inventoryController.getAllInventory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.pending === "true") filter.pending = true;
    if (req.query.itemType) filter.itemType = req.query.itemType;

    const inventory = await InventoryModel.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("inventoryController.getAllInventory:", error);
    return res.status(500).json({
      title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde.",
    });
  }
};

// Crea un insumo mínimo (nombre + unidad) desde el builder de receta de una
// bebida/platillo/extra. Queda marcado como "pendiente" hasta que el admin lo
// complete desde Inventario. Siempre nace como "producto" (los activos fijos
// no participan de recetas).
inventoryController.insertQuickInventory = async (req, res) => {
  try {
    const { name, unit, type } = req.body;

    const validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (!unit) {
      return res.status(400).json({ title: "Unidad requerida", message: "La unidad es requerida." });
    }

    const newInventory = new InventoryModel({
      name,
      itemType: "producto",
      unit,
      price: 0,
      ubication: "",
      quantity: 0,
      type: type || "Otros",
      status: "Disponible",
      pending: true,
    });

    await newInventory.save();

    return res.status(201).json({
      message: "Insumo pendiente creado",
      newInventory,
    });
  } catch (error) {
    console.error("inventoryController.insertQuickInventory:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Busca un producto específico usando su ID
inventoryController.getInventoryById = async (req, res) => {
  try {
    const inventory = await InventoryModel.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        title: "Insumo no encontrado", message: "No se encontró el insumo solicitado.",
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("inventoryController.getInventoryById:", error);
    return res.status(500).json({
      title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde.",
    });
  }
};

// Registra un nuevo artículo en el inventario: un producto (materia prima,
// descuenta stock por recetas) o un activo fijo (mobiliario/equipo, solo se
// controla cantidad y condición).
inventoryController.insertInventory = async (req, res) => {
  try {
    const {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
      unit,
      itemType,
      condition,
      acquisitionDate,
      lowStockAlert,
    } = req.body;
    const finalItemType = itemType === "activo_fijo" ? "activo_fijo" : "producto";

    let validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateItemType(finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUbication(ubication);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateCategory(type, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateCondition(condition, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUnit(unit, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateLowStockAlert(lowStockAlert, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Preparamos los datos del artículo nuevo
    const newInventory = new InventoryModel({
      name,
      itemType: finalItemType,
      price,
      ubication,
      quantity,
      type,
      status,
      unit: finalItemType === "producto" ? unit : undefined,
      condition: finalItemType === "activo_fijo" ? condition : undefined,
      acquisitionDate: finalItemType === "activo_fijo" && acquisitionDate ? acquisitionDate : undefined,
      lowStockAlert: finalItemType === "producto" ? Number(lowStockAlert) : undefined,
      ...(req.file ? { image: req.file.path, publicId: req.file.filename } : {}),
    });

    // Guardamos el producto en la base de datos
    await newInventory.save();

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "created",
      title: finalItemType === "activo_fijo" ? "Activo fijo agregado" : "Insumo agregado",
      message: (actor) =>
        `${actor.name} agregó ${newInventory.name} al inventario (${newInventory.quantity} unidades)`,
      icon: "box",
      severity: "success",
      entity: { model: "Inventory", id: newInventory._id, label: newInventory.name },
    });

    // Si entró ya por debajo del mínimo, avisamos de una vez (solo aplica a productos)
    if (finalItemType === "producto") {
      await notifyIfLowStock(req, newInventory);
    }

    return res.status(201).json({
      title: "Insumo agregado", message: "El insumo se guardó correctamente.",
      newInventory,
    });
  } catch (error) {
    console.error("inventoryController.insertInventory:", error);
    return res.status(500).json({
      title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde.",
    });
  }
};

// ELIMINAR PRODUCTO
inventoryController.deleteInventory = async (req, res) => {
  try {
    const inventoryFound = await InventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({title: "Insumo no encontrado", message: "No se encontró el insumo solicitado.",});
    }

    if (inventoryFound.publicId) {
      await cloudinary.uploader.destroy(inventoryFound.publicId);
    }

    await InventoryModel.findByIdAndDelete(req.params.id);

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "deleted",
      title: "Insumo eliminado",
      message: (actor) => `${actor.name} eliminó ${inventoryFound.name} del inventario`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Inventory", id: inventoryFound._id, label: inventoryFound.name },
    });

    return res.status(200).json({
      title: "Insumo eliminado", message: "El insumo se eliminó correctamente.",
    });
  } catch (error) {
    console.error("inventoryController.deleteInventory:", error);
    return res.status(500).json({
      title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde.",
    });
  }
};

// ACTUALIZAR PRODUCTO
inventoryController.updateInventory = async (req, res) => {
  try {
    const {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
      unit,
      itemType,
      condition,
      acquisitionDate,
      lowStockAlert,
    } = req.body;
    const finalItemType = itemType === "activo_fijo" ? "activo_fijo" : "producto";

    let validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateItemType(finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUbication(ubication);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateCategory(type, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateCondition(condition, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUnit(unit, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateLowStockAlert(lowStockAlert, finalItemType);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Si todo es válido, buscamos el producto original para comprobar que existe
    const inventoryFound = await InventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({title: "Insumo no encontrado", message: "No se encontró el insumo solicitado.",});
    }

    // Agrupamos los datos nuevos. Pasar por aquí implica que el formulario
    // completo fue validado, así que cualquier insumo "pendiente" queda completo.
    const updatedData = {
      name,
      itemType: finalItemType,
      price,
      ubication,
      quantity,
      type,
      status,
      unit: finalItemType === "producto" ? unit : undefined,
      condition: finalItemType === "activo_fijo" ? condition : undefined,
      acquisitionDate: finalItemType === "activo_fijo" && acquisitionDate ? acquisitionDate : undefined,
      lowStockAlert: finalItemType === "producto" ? Number(lowStockAlert) : undefined,
      pending: false,
    };

    if (req.file) {
      if (inventoryFound.publicId) {
        await cloudinary.uploader.destroy(inventoryFound.publicId);
      }
      updatedData.image = req.file.path;
      updatedData.publicId = req.file.filename;
    }

    const updatedInventory = await InventoryModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    // Si la cantidad cambió lo decimos explícitamente: es el dato que más
    // le importa a quien administra la bodega.
    const quantityChanged = Number(inventoryFound.quantity) !== Number(updatedInventory.quantity);

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "updated",
      title: finalItemType === "activo_fijo" ? "Activo fijo actualizado" : "Insumo actualizado",
      message: (actor) =>
        quantityChanged
          ? `${actor.name} ajustó ${updatedInventory.name}: de ${inventoryFound.quantity} a ${updatedInventory.quantity} unidades`
          : `${actor.name} actualizó los datos de ${updatedInventory.name}`,
      icon: "box",
      severity: "info",
      entity: { model: "Inventory", id: updatedInventory._id, label: updatedInventory.name },
    });

    // Tras el ajuste puede que haya quedado por debajo del mínimo (solo productos)
    if (finalItemType === "producto") {
      await notifyIfLowStock(req, updatedInventory);
      await disableDependentSaucers(req, updatedInventory);
    }

    return res.status(200).json({
      title: "Insumo actualizado", message: "El insumo se actualizó correctamente.",updatedInventory,
    });
  }catch (error) {
    console.error("inventoryController.updateInventory:", error);
    return res.status(500).json({title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde."});
  }
};

export default inventoryController;
