import saucersModel from "../models/saucersModel.js";
import { v2 as cloudinary } from "cloudinary";

// Array de funciones
const saucersController = {};

// OBTENER TODOS LOS PLATILLOS
saucersController.getAllSaucers = async (req, res) => {
  try {
    const saucers = await saucersModel.find();
    return res.status(200).json(saucers);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// INSERTAR PLATILLO
saucersController.insertSaucer = async (req, res) => {
  try {
    // Obtener los datos del body
    const { name, category, price, status } = req.body;

    // Crear nuevo registro
    const newSaucer = new saucersModel({
      name,
      category,
      price,
      status,
      image: req.file.path,
      public_id: req.file.filename,
    });

    // Guardar en la base de datos
    await newSaucer.save();

    return res.status(200).json({
      message: "Saucer saved successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ELIMINAR PLATILLO
saucersController.deleteSaucer = async (req, res) => {
  try {
    // Buscar el platillo
    const saucerFound = await saucersModel.findById(req.params.id);

    // Eliminar imagen de Cloudinary
    await cloudinary.uploader.destroy(saucerFound.public_id);

    // Eliminar de la base de datos
    await saucersModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Saucer deleted successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ACTUALIZAR PLATILLO
saucersController.updateSaucer = async (req, res) => {
  try {
    // Obtener los nuevos datos
    const { name, category, price, status } = req.body;

    // Buscar el platillo a actualizar
    const saucerFound = await saucersModel.findById(req.params.id);

    const updatedData = {
      name,
      category,
      price,
      status,
    };

    // Si viene una nueva imagen
    if (req.file) {
      // Eliminar imagen anterior
      await cloudinary.uploader.destroy(saucerFound.public_id);

      // Guardar nueva imagen
      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    // Actualizar en la base de datos
    await saucersModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    return res.status(200).json({
      message: "Saucer updated successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default saucersController;