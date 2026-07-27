// Importamos el modelo de los platillos, Cloudinary para imágenes y validaciones
import saucersModel from "../../models/menu/saucersModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsSaucers from "../../utils/saucers/validationsSaucersUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";

// Objeto para agrupar todas las funciones de los platillos
const saucersController = {};

// Obtiene todos los platillos sin importar su estado
saucersController.getAllSaucers = async (req, res) => {
  try {
    const saucers = await saucersModel.find();
    return res.status(200).json(saucers);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Obtiene solo los platillos que están activos (disponibles para venta)
saucersController.getActiveSaucers = async (req, res) => {
  try {
    const saucers = await saucersModel.find({ status: "activo" });

    return res.status(200).json(saucers);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Crea un nuevo platillo en el menú, incluyendo su imagen
saucersController.insertSaucer = async (req, res) => {
  try {
    const { name, category, price, status } = req.body;

    let validation = validationsSaucers.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const newSaucer = new saucersModel({
      name,
      category,
      price,
      status,
      image: req.file.path,
      public_id: req.file.filename,
    });

    await newSaucer.save();

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "created",
      title: "Platillo agregado",
      message: (actor) =>
        `${actor.name} agregó el platillo ${newSaucer.name} al menú ($${Number(newSaucer.price).toFixed(2)})`,
      icon: "utensils",
      severity: "success",
      entity: { model: "Saucers", id: newSaucer._id, label: newSaucer.name },
    });

    return res.status(200).json({message: "Saucer saved successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error"});
  }
};

// Elimina un platillo del menú y borra la imagen asociada de Cloudinary
saucersController.deleteSaucer = async (req, res) => {
  try {
    const saucerFound = await saucersModel.findById(req.params.id);
    if (!saucerFound) {
      return res.status(404).json({ message: "Saucer not found" });
    }

    // Solo intenta borrar la imagen si existe public_id
    if (saucerFound.public_id) {
      await cloudinary.uploader.destroy(saucerFound.public_id);
    }

    await saucersModel.findByIdAndDelete(req.params.id);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "deleted",
      title: "Platillo eliminado",
      message: (actor) => `${actor.name} eliminó el platillo ${saucerFound.name} del menú`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Saucers", id: saucerFound._id, label: saucerFound.name },
    });

    return res.status(200).json({ message: "Saucer deleted successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza un platillo (nombre, categoría, precio, estado y/o imagen)
saucersController.updateSaucer = async (req, res) => {
  try {
    const { name, category, price, status } = req.body;

    let validation = validationsSaucers.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsSaucers.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const saucerFound = await saucersModel.findById(req.params.id);

    const updatedData = {
      name,
      category,
      price,
      status,
    };

    // Si hay una nueva imagen, borramos la antigua y registramos la nueva
    if (req.file) {
      await cloudinary.uploader.destroy(saucerFound.public_id);

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await saucersModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    // Reportamos explícitamente el cambio de precio, que es lo más sensible del menú
    const priceChanged = Number(saucerFound?.price) !== Number(price);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "updated",
      title: "Platillo actualizado",
      message: (actor) =>
        priceChanged
          ? `${actor.name} cambió el precio de ${name}: de $${Number(saucerFound?.price || 0).toFixed(2)} a $${Number(price).toFixed(2)}`
          : `${actor.name} actualizó el platillo ${name}`,
      icon: "utensils",
      severity: "info",
      entity: { model: "Saucers", id: req.params.id, label: name },
    });

    return res.status(200).json({message: "Saucer updated successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

export default saucersController;