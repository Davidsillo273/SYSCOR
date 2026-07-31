// Importamos el modelo de los combos, Cloudinary para imágenes y validaciones
import CombosModel from "../../models/menu/combosModel.js";
import CartModel from "../../models/orders/cartModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsCombos from "../../utils/combos/validationsCombosUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";
import { findByNameInsensitive } from "../../utils/common/duplicateNameUtils.js";

// Objeto para agrupar todas las funciones de los combos
const combosController = {};

// Busca si ya existe un combo con ese nombre (sugerencia, no bloqueo)
combosController.checkName = async (req, res) => {
  try {
    const existing = await findByNameInsensitive(CombosModel, req.query.name);
    return res.status(200).json({ existing: existing || null });
  } catch (error) {
    console.error("combosController.checkName:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

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
  query
    .populate("saucers.saucerId")
    .populate("selectiveOptions.saucerId")
    .populate({ path: "drinkPolicy.drinkSetIds", populate: { path: "drinkIds" } })
    .populate("drinkPolicy.thirdPartyDrinkIds");

// Obtiene todos los combos y también incluye (populate) los detalles de los platillos y bebidas que lo componen
combosController.getAllCombos = async (req, res) => {
  try {
    const combos = await populateCombo(CombosModel.find().sort({ createdAt: -1 }));

    return res.status(200).json(combos);
  } catch (error) {
    console.error("combosController.getAllCombos:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};


// Obtiene solo los combos disponibles para venta, con sus platillos y bebidas
combosController.getActiveCombos = async (req, res) => {
  try {
    const combos = await populateCombo(CombosModel.find({ status: "disponible" }));

    return res.status(200).json(combos);
  } catch (error) {
    console.error("combosController.getActiveCombos:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};


// Busca un combo específico por su ID y trae todos los detalles (platillos y bebidas)
combosController.getComboById = async (req, res) => {
  try {
    const combo = await populateCombo(CombosModel.findById(req.params.id));

    if (!combo) {
      return res.status(404).json({title: "Combo no encontrado", message: "No se encontró el combo solicitado.",});
    }

    return res.status(200).json(combo);
  } catch (error) {
    console.error("combosController.getComboById:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Ranking de combos más vendidos, contando cuántas unidades se han pedido
// en todos los carritos registrados
combosController.getBestSellers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const ranking = await CartModel.aggregate([
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
    console.error("combosController.getBestSellers:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Crea un nuevo combo en la base de datos (imagen opcional)
combosController.insertCombo = async (req, res) => {
  try {
    const { name, price, description, status, category, selective, selectiveMaxPicks } = req.body;
    const saucers = parseJsonField(req.body.saucers, []);
    const selectiveOptions = parseJsonField(req.body.selectiveOptions, []);
    const drinkPolicy = parseJsonField(req.body.drinkPolicy, {});
    const isSelective = selective === "true" || selective === true;

    let validation = validationsCombos.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSaucers(saucers, isSelective, selectiveOptions);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSelectiveMaxPicks(isSelective, selectiveMaxPicks, selectiveOptions.length);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validatePrice(price);
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

    const newCombo = new CombosModel({
      name,
      category,
      saucers: isSelective ? [] : saucers,
      selective: isSelective,
      selectiveOptions: isSelective ? selectiveOptions : [],
      selectiveMaxPicks: isSelective ? Number(selectiveMaxPicks) : undefined,
      drinkPolicy,
      price,
      description,
      status: finalStatus,
      ...(req.file ? { image: req.file.path, publicId: req.file.filename } : {}),
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
      title: "Combo agregado", message: "El combo se guardó correctamente.",
      newCombo,
    });
  } catch (error) {
    console.error("combosController.insertCombo:", error);
    return res.status(500).json({title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde."});
  }
};

// Elimina un combo y su imagen alojada en Cloudinary
combosController.deleteCombo = async (req, res) => {
  try {
    const comboFound = await CombosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({ title: "Combo no encontrado", message: "No se encontró el combo solicitado." });
    }

    // Solo eliminar la imagen si existe un publicId
    if (comboFound.publicId) {
      await cloudinary.uploader.destroy(comboFound.publicId);
    }

    await CombosModel.findByIdAndDelete(req.params.id);

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

    return res.status(200).json({ title: "Combo eliminado", message: "El combo se eliminó correctamente." });
  } catch (error) {
    console.error("combosController.deleteCombo:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde." });
  }
};

// Actualiza un combo (detalles, platillos/bebidas permitidas, precio, estado y/o imagen)
combosController.updateCombo = async (req, res) => {
  try {
    const { name, price, description, status, category, selective, selectiveMaxPicks } = req.body;
    const saucers = parseJsonField(req.body.saucers, []);
    const selectiveOptions = parseJsonField(req.body.selectiveOptions, []);
    const drinkPolicy = parseJsonField(req.body.drinkPolicy, {});
    const isSelective = selective === "true" || selective === true;

    let validation = validationsCombos.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateCategory(category);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSaucers(saucers, isSelective, selectiveOptions);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validateSelectiveMaxPicks(isSelective, selectiveMaxPicks, selectiveOptions.length);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsCombos.validatePrice(price);
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

    const comboFound = await CombosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({title: "Combo no encontrado", message: "No se encontró el combo solicitado.",});
    }

    const updatedData = {
      name,
      category,
      saucers: isSelective ? [] : saucers,
      selective: isSelective,
      selectiveOptions: isSelective ? selectiveOptions : [],
      selectiveMaxPicks: isSelective ? Number(selectiveMaxPicks) : null,
      drinkPolicy,
      price,
      description,
      status,
    };

    // Si nos envían una nueva imagen, eliminamos la vieja de Cloudinary y guardamos la nueva
    if (req.file) {
      if (comboFound.publicId) {
        await cloudinary.uploader.destroy(comboFound.publicId);
      }

      updatedData.image = req.file.path;
      updatedData.publicId = req.file.filename;
    }

    const updatedCombo = await CombosModel.findByIdAndUpdate(
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
      title: "Combo actualizado", message: "El combo se actualizó correctamente.",
      updatedCombo,
    });
  } catch (error) {
    console.error("combosController.updateCombo:", error);
    return res.status(500).json({title: "Error del servidor", message: "Ocurrió un problema interno. Intenta de nuevo más tarde.",});
  }
};

export default combosController;
