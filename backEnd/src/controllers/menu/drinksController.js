// Importamos el modelo de las bebidas, Cloudinary para imágenes y validaciones
import drinkModel from "../../models/menu/drinksModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsDrinks from "../../utils/drinks/validationsDrinksUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";

// Creamos un objeto para agrupar todas las funciones de bebidas
const drinksController = {};

// Obtiene todas las bebidas guardadas en el menú
drinksController.getAllDrinks = async (req, res) => {
  try {
    const drinks = await drinkModel.find();
    return res.status(200).json(drinks);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Obtiene solo las bebidas que están marcadas como activas
drinksController.getActiveDrinks = async (req, res) => {
  try {
    const drinks = await drinkModel.find({ status: "activo" });

    return res.status(200).json(drinks);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Crea una nueva bebida en la base de datos (con imagen)
drinksController.insertDrink = async (req, res) => {
  try {
    const { name, price, quantity, status } = req.body;

    let validation = validationsDrinks.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsDrinks.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsDrinks.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsDrinks.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsDrinks.validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Crear nuevo registro
    const newDrink = new drinkModel({
      name,
      price,
      quantity,
      status,
      image: req.file.path,
      public_id: req.file.filename,
    });

    // Guardar en la base de datos
    await newDrink.save();

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "created",
      title: "Bebida agregada",
      message: (actor) =>
        `${actor.name} agregó la bebida ${newDrink.name} al menú ($${Number(newDrink.price).toFixed(2)})`,
      icon: "wine-glass",
      severity: "success",
      entity: { model: "Drinks", id: newDrink._id, label: newDrink.name },
    });

    return res.status(200).json({
      message: "Drink saved successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

// Elimina una bebida del menú y también borra su imagen de Cloudinary
drinksController.deleteDrink = async (req, res) => {
  try {
    const drinkFound = await drinkModel.findById(req.params.id);
    if (!drinkFound) {
      return res.status(404).json({ message: "Drink not found" });
    }

    // Si tiene imagen asociada, la borramos de Cloudinary
    if (drinkFound.public_id) {
      await cloudinary.uploader.destroy(drinkFound.public_id);
    }

    await drinkModel.findByIdAndDelete(req.params.id);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "deleted",
      title: "Bebida eliminada",
      message: (actor) => `${actor.name} eliminó la bebida ${drinkFound.name} del menú`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Drinks", id: drinkFound._id, label: drinkFound.name },
    });

    return res.status(200).json({ message: "Drink deleted successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza los datos de una bebida (precio, nombre, o si sube una imagen nueva)
drinksController.updateDrink = async (req, res) => {
  try {
    const { name, price, quantity, status } = req.body;

    // Validaciones
    let validation = validationsDrinks.validateName(name);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    validation = validationsDrinks.validatePrice(price);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    validation = validationsDrinks.validateQuantity(quantity);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    validation = validationsDrinks.validateStatus(status);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    // Verificar que la bebida existe
    const drinkFound = await drinkModel.findById(req.params.id);
    if (!drinkFound) {
      return res.status(404).json({ message: "Drink not found" });
    }

    const updatedData = { name, price, quantity, status };

    // Si se envió una nueva imagen, borramos la anterior (si existía) y guardamos la nueva
    if (req.file) {
      if (drinkFound.public_id) {
        await cloudinary.uploader.destroy(drinkFound.public_id);
      }
      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await drinkModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    // El cambio de precio es el que más interesa reportar
    const priceChanged = Number(drinkFound.price) !== Number(price);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "updated",
      title: "Bebida actualizada",
      message: (actor) =>
        priceChanged
          ? `${actor.name} cambió el precio de ${name}: de $${Number(drinkFound.price).toFixed(2)} a $${Number(price).toFixed(2)}`
          : `${actor.name} actualizó la bebida ${name}`,
      icon: "wine-glass",
      severity: "info",
      entity: { model: "Drinks", id: drinkFound._id, label: name },
    });

    return res.status(200).json({ message: "Drink updated successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default drinksController;