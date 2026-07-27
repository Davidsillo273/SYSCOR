// Importamos el modelo de inventario y la utilidad que valida los datos
import inventoryModel from "../../models//inventory/inventoryModel.js";
import validationsInventory from "../../utils/inventory/validationsInventoryUtils.js";
// Utilidades para registrar movimientos y para leer el umbral de stock bajo configurado
import notificationUtils from "../../utils/notifications/notificationUtils.js";
import settingsUtils from "../../utils/settings/settingsUtils.js";

const inventoryController = {};

// Revisa si un insumo quedó por debajo del mínimo configurado en Ajustes y,
// de ser así, levanta una alerta aparte para que nadie se quede sin producto.
const notifyIfLowStock = async (req, product) => {
  try {
    const settings = await settingsUtils.getOrCreateSettings();
    const threshold = settings.operation?.lowStockThresholds?.inventory ?? 10;

    if (Number(product.quantity) > threshold) return;

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "low_stock",
      title: "Alerta de stock",
      message: `Stock bajo: ${product.name} quedó en ${product.quantity} unidades (mínimo ${threshold})`,
      icon: "triangle-exclamation",
      severity: "warning",
      entity: { model: "Inventory", id: product._id, label: product.name },
    });
  } catch (error) {
    console.error("inventoryController.notifyIfLowStock:", error);
  }
};

// Obtiene todos los productos registrados en el inventario.
// ?pending=true filtra solo los insumos creados al vuelo que faltan por completar
inventoryController.getAllInventory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.pending === "true") filter.pending = true;

    const inventory = await inventoryModel.find(filter);

    return res.status(200).json(inventory);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Crea un insumo mínimo (nombre + unidad) desde el builder de receta de una
// bebida. Queda marcado como "pendiente" hasta que el admin lo complete desde Inventario.
inventoryController.insertQuickInventory = async (req, res) => {
  try {
    const { name, unit, type } = req.body;

    const validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (!unit) {
      return res.status(400).json({ message: "La unidad es requerida." });
    }

    const newInventory = new inventoryModel({
      name,
      unit,
      price: 0,
      ubication: "",
      quantity: 0,
      type: type || "Otros",
      status: "disponible",
      pending: true,
    });

    await newInventory.save();

    return res.status(201).json({
      message: "Insumo pendiente creado",
      newInventory,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Busca un producto específico usando su ID
inventoryController.getInventoryById = async (req, res) => {
  try {
    const inventory = await inventoryModel.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Registra un nuevo producto en el inventario
inventoryController.insertInventory = async (req, res) => {
  try {
    const {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    } = req.body;

    let validation = validationsInventory.validateName(name);
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

    validation = validationsInventory.validateType(type);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Preparamos los datos del producto nuevo
    const newInventory = new inventoryModel({
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    });

    // Guardamos el producto en la base de datos
    await newInventory.save();

    await notificationUtils.createNotification({
      req,
      category: "inventory",
      action: "created",
      title: "Insumo agregado",
      message: (actor) =>
        `${actor.name} agregó ${newInventory.name} al inventario (${newInventory.quantity} unidades)`,
      icon: "box",
      severity: "success",
      entity: { model: "Inventory", id: newInventory._id, label: newInventory.name },
    });

    // Si entró ya por debajo del mínimo, avisamos de una vez
    await notifyIfLowStock(req, newInventory);

    return res.status(201).json({
      message: "Product saved successfully",
      newInventory,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ELIMINAR PRODUCTO
inventoryController.deleteInventory = async (req, res) => {
  try {
    const inventoryFound = await inventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({message: "Product not found",});
    }

    await inventoryModel.findByIdAndDelete(req.params.id);

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
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
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
    } = req.body;

    let validation = validationsInventory.validateName(name);
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

    validation = validationsInventory.validateType(type);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Si todo es válido, buscamos el producto original para comprobar que existe
    const inventoryFound = await inventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({message: "Product not found",});
    }

    // Agrupamos los datos nuevos. Pasar por aquí implica que el formulario
    // completo fue validado, así que cualquier insumo "pendiente" queda completo.
    const updatedData = {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
      pending: false,
    };

    const updatedInventory = await inventoryModel.findByIdAndUpdate(
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
      title: "Insumo actualizado",
      message: (actor) =>
        quantityChanged
          ? `${actor.name} ajustó ${updatedInventory.name}: de ${inventoryFound.quantity} a ${updatedInventory.quantity} unidades`
          : `${actor.name} actualizó los datos de ${updatedInventory.name}`,
      icon: "box",
      severity: "info",
      entity: { model: "Inventory", id: updatedInventory._id, label: updatedInventory.name },
    });

    // Tras el ajuste puede que haya quedado por debajo del mínimo
    await notifyIfLowStock(req, updatedInventory);

    return res.status(200).json({
      message: "Product updated successfully",updatedInventory,
    });
  }catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error"});
  }
};

export default inventoryController;