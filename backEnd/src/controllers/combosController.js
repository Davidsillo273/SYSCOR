import combosModel from "../models/combosModel.js";
import { v2 as cloudinary } from "cloudinary";

// Array de funciones
const combosController = {};

// OBTENER TODOS LOS COMBOS
combosController.getAllCombos = async (req, res) => {
  try {
    const combos = await combosModel
      .find()
      .populate("saucersId")
      .populate("drinksId");

    return res.status(200).json(combos);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// OBTENER COMBO POR ID
combosController.getComboById = async (req, res) => {
  try {
    const combo = await combosModel
      .findById(req.params.id)
      .populate("saucersId")
      .populate("drinksId");

    if (!combo) {
      return res.status(404).json({
        message: "Combo not found",
      });
    }

    return res.status(200).json(combo);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// INSERTAR COMBO
combosController.insertCombo = async (req, res) => {
  try {
    const {
      name,
      saucersId,
      drinksId,
      price,
      quantity,
      description,
      status,
    } = req.body;

    const newCombo = new combosModel({
      name,
      saucersId,
      drinksId,
      price,
      quantity,
      description,
      status,
      image: req.file.path,
      public_id: req.file.filename,
    });

    await newCombo.save();

    return res.status(201).json({
      message: "Combo saved successfully",
      newCombo,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ELIMINAR COMBO
combosController.deleteCombo = async (req, res) => {
  try {
    const comboFound = await combosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({
        message: "Combo not found",
      });
    }

    await cloudinary.uploader.destroy(comboFound.public_id);

    await combosModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Combo deleted successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ACTUALIZAR COMBO
combosController.updateCombo = async (req, res) => {
  try {
    const {
      name,
      saucersId,
      drinksId,
      price,
      quantity,
      description,
      status,
    } = req.body;

    const comboFound = await combosModel.findById(req.params.id);

    if (!comboFound) {
      return res.status(404).json({
        message: "Combo not found",
      });
    }

    const updatedData = {
      name,
      saucersId,
      drinksId,
      price,
      quantity,
      description,
      status,
    };

    // Si viene una nueva imagen
    if (req.file) {
      await cloudinary.uploader.destroy(comboFound.public_id);

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    const updatedCombo = await combosModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Combo updated successfully",
      updatedCombo,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default combosController;