// Importamos el modelo de los platillos, Cloudinary para imágenes y validaciones
import saucersModel from "../../models/menu/saucersModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsSaucers from "../../utils/saucers/validationsSaucersUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";
import combosModel from "../../models/menu/combosModel.js";
import cartModel from "../../models/orders/cartModel.js";

// Objeto para agrupar todas las funciones de los platillos
const saucersController = {};

// La receta llega como FormData, así que viaja como string JSON
const parseRecipe = (rawRecipe) => {
  if (!rawRecipe) return [];
  if (Array.isArray(rawRecipe)) return rawRecipe;
  try {
    const parsed = JSON.parse(rawRecipe);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Si un platillo deja de estar activo, ningún combo que lo incluya puede
// seguir vendiéndose: se deshabilitan automáticamente. No se reactivan solos
// al reactivar el platillo, el admin debe revisarlos.
const cascadeDisableCombos = async (req, saucerId, saucerName) => {
  try {
    const affectedCombos = await combosModel.find({ "saucers.saucerId": saucerId, status: "disponible" });
    if (affectedCombos.length === 0) return;

    await combosModel.updateMany(
      { "saucers.saucerId": saucerId, status: "disponible" },
      { status: "no disponible" }
    );

    for (const combo of affectedCombos) {
      await notificationUtils.createNotification({
        req,
        category: "menu",
        action: "status_changed",
        title: "Combo deshabilitado automáticamente",
        message: `El combo ${combo.name} se deshabilitó porque el platillo ${saucerName} ya no está activo`,
        icon: "shopping-bag",
        severity: "warning",
        entity: { model: "Combos", id: combo._id, label: combo.name },
      });
    }
  } catch (error) {
    console.error("saucersController.cascadeDisableCombos:", error);
  }
};

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
    const saucers = await saucersModel.find({ status: "Activo" });

    return res.status(200).json(saucers);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Ranking de platillos más vendidos. Los platillos no están referenciados
// directo en el carrito (solo a través de los combos que los incluyen), así
// que hace falta un doble $lookup: carrito -> combo -> platillo.
saucersController.getBestSellers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const ranking = await cartModel.aggregate([
      { $unwind: "$details" },
      { $unwind: "$details.combos" },
      {
        $lookup: {
          from: "combos",
          localField: "details.combos.comboId",
          foreignField: "_id",
          as: "combo",
        },
      },
      { $unwind: "$combo" },
      { $unwind: "$combo.saucers" },
      {
        $group: {
          _id: "$combo.saucers.saucerId",
          totalSold: { $sum: "$details.combos.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "saucers",
          localField: "_id",
          foreignField: "_id",
          as: "saucer",
        },
      },
      { $unwind: "$saucer" },
      { $project: { _id: 0, saucer: 1, totalSold: 1 } },
    ]);

    return res.status(200).json(ranking);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Crea un nuevo platillo en el menú (imagen y receta opcionales)
saucersController.insertSaucer = async (req, res) => {
  try {
    const { name, category, price, status, isBirria } = req.body;
    const recipe = parseRecipe(req.body.recipe);

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

    // Nace 'Activo' por default: el admin no crea algo pensado para estar deshabilitado
    const finalStatus = status || "Activo";
    validation = validationsSaucers.validateStatus(finalStatus);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const birriaApplies = ["Burritos", "Tortas", "Tacos"].includes(category);

    const newSaucer = new saucersModel({
      name,
      category,
      isBirria: birriaApplies ? Boolean(isBirria === "true" || isBirria === true) : false,
      price,
      status: finalStatus,
      recipe,
      ...(req.file ? { image: req.file.path, public_id: req.file.filename } : {}),
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

// Actualiza un platillo (nombre, categoría, precio, estado, receta y/o imagen)
saucersController.updateSaucer = async (req, res) => {
  try {
    const { name, category, price, status, isBirria } = req.body;
    const recipe = parseRecipe(req.body.recipe);

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

    const birriaApplies = ["Burritos", "Tortas", "Tacos"].includes(category);

    const updatedData = {
      name,
      category,
      isBirria: birriaApplies ? Boolean(isBirria === "true" || isBirria === true) : false,
      price,
      status,
      recipe,
    };

    // Si hay una nueva imagen, borramos la antigua y registramos la nueva
    if (req.file) {
      if (saucerFound?.public_id) {
        await cloudinary.uploader.destroy(saucerFound.public_id);
      }

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

    if (status !== "Activo") {
      await cascadeDisableCombos(req, req.params.id, name);
    }

    return res.status(200).json({message: "Saucer updated successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

export default saucersController;
