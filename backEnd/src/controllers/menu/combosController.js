// Importamos el modelo de los combos, Cloudinary para imágenes y validaciones
import combosModel from "../../models/menu/combosModel.js";
import cartModel from "../../models/orders/cartModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsCombos from "../../utils/combos/validationsCombosUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";

// Objeto para agrupar todas las funciones de los combos
const combosController = {};

// saucers y drinkPolicy llegan como FormData, así que viajan como string JSON
const parseJsonField = (raw, fallback) => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const populateCombo = (query) =>
  query.populate("saucers.saucerId").populate("drinkPolicy.thirdPartyDrinkIds");

// Obtiene todos los combos y también incluye (populate) los detalles de los platillos y bebidas que lo componen
combosController.getAllCombos = async (req, res) => {
  try {
    const combos = await populateCombo(combosModel.find());

    return res.status(200).json(combos);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Obtiene solo los combos disponibles para venta, con sus platillos y bebidas
combosController.getActiveCombos = async (req, res) => {
  try {
    const combos = await populateCombo(combosModel.find({ status: "disponible" }));

    return res.status(200).json(combos);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Busca un combo específico por su ID y trae todos los detalles (platillos y bebidas)
combosController.getComboById = async (req, res) => {
  try {
    const combo = await populateCombo(combosModel.findById(req.params.id));

    if (!combo) {
      return res.status(404).json({message: "Combo not found",});
    }

    return res.status(200).json(combo);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Ranking de combos más vendidos, contando cuántas unidades se han pedido
// en todos los carritos registrados
combosController.getBestSellers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const ranking = await cartModel.aggregate([
      { $unwind: "$details" },
      { $unwind: "$details.combos" },
      {
        $group: {
          _id: "$details.combos.comboId",
          totalSold: { $sum: "$details.combos.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "combos",
          localField: "_id",
          foreignField: "_id",
          as: "combo",
        },
      },
      { $unwind: "$combo" },
      { $project: { _id: 0, combo: 1, totalSold: 1 } },
    ]);

    return res.status(200).json(ranking);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Crea un nuevo combo en la base de datos (imagen opcional)
combosController.insertCombo = async (req, res) => {
  try {
    const { name, price, quantity, description, status, category } = req.body;
    const saucers = parseJsonField(req.body.saucers, []);
    const drinkPolicy = parseJsonField(req.body.drinkPolicy, {});

    let validation = validationsCombos.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSaucers(saucers);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateDescription(description);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    // Nace disponible por default: el admin no crea algo pensado para estar deshabilitado
    const finalStatus = status || "disponible";
    validation = validationsCombos.validateStatus(finalStatus);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const newCombo = new combosModel({
      name,
      category,
      saucers,
      drinkPolicy,
      price,
      quantity,
      description,
      status: finalStatus,
      ...(req.file ? { image: req.file.path, public_id: req.file.filename } : {}),
    });

    await newCombo.save();

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "created",
      title: "Combo agregado",
      message: (actor) =>
        `${actor.name} agregó el combo ${newCombo.name} al menú ($${Number(newCombo.price).toFixed(2)})`,
      icon: "shopping-bag",
      severity: "success",
      entity: { model: "Combos", id: newCombo._id, label: newCombo.name },
    });

    return res.status(201).json({
      message: "Combo saved successfully",
      newCombo,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error"});
  }
};

// Elimina un combo y su imagen alojada en Cloudinary
combosController.deleteCombo = async (req, res) => {
  try {
    const comboFound = await combosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({ message: "Combo not found" });
    }

    // Solo eliminar la imagen si existe un public_id
    if (comboFound.public_id) {
      await cloudinary.uploader.destroy(comboFound.public_id);
    }

    await combosModel.findByIdAndDelete(req.params.id);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "deleted",
      title: "Combo eliminado",
      message: (actor) => `${actor.name} eliminó el combo ${comboFound.name} del menú`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Combos", id: comboFound._id, label: comboFound.name },
    });

    return res.status(200).json({ message: "Combo deleted successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza un combo (detalles, platillos/bebidas permitidas, precio, estado y/o imagen)
combosController.updateCombo = async (req, res) => {
  try {
    const { name, price, quantity, description, status, category } = req.body;
    const saucers = parseJsonField(req.body.saucers, []);
    const drinkPolicy = parseJsonField(req.body.drinkPolicy, {});

    let validation = validationsCombos.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSaucers(saucers);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateDescription(description);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const comboFound = await combosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({message: "Combo not found",});
    }

    const updatedData = {
      name,
      category,
      saucers,
      drinkPolicy,
      price,
      quantity,
      description,
      status,
    };

    // Si nos envían una nueva imagen, eliminamos la vieja de Cloudinary y guardamos la nueva
    if (req.file) {
      if (comboFound.public_id) {
        await cloudinary.uploader.destroy(comboFound.public_id);
      }

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    const updatedCombo = await combosModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    const priceChanged = Number(comboFound.price) !== Number(price);

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "updated",
      title: "Combo actualizado",
      message: (actor) =>
        priceChanged
          ? `${actor.name} cambió el precio del combo ${updatedCombo.name}: de $${Number(comboFound.price).toFixed(2)} a $${Number(price).toFixed(2)}`
          : `${actor.name} actualizó el combo ${updatedCombo.name}`,
      icon: "shopping-bag",
      severity: "info",
      entity: { model: "Combos", id: updatedCombo._id, label: updatedCombo.name },
    });

    return res.status(200).json({
      message: "Combo updated successfully",
      updatedCombo,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

export default combosController;
