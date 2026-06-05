import drinkModel from "../models/drinksModel.js";
import { v2 as cloudinary } from "cloudinary";

// Array de funciones
const drinksController = {};

// OBTENER TODOS LOS DRINKS
drinksController.getAllDrinks = async (req, res) => {
  try {
    const drinks = await drinkModel.find();
    return res.status(200).json(drinks);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// INSERTAR DRINK
drinksController.insertDrink = async (req, res) => {
  try {
    // Obtener los datos del body
    const { name, price, quantity, status } = req.body;

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

    return res.status(200).json({
      message: "Drink saved successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ELIMINAR DRINK
drinksController.deleteDrink = async (req, res) => {
  try {
    // Buscar el drink
    const drinkFound = await drinkModel.findById(req.params.id);

    // Eliminar imagen de Cloudinary
    await cloudinary.uploader.destroy(drinkFound.public_id);

    // Eliminar de la base de datos
    await drinkModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Drink deleted successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ACTUALIZAR DRINK
drinksController.updateDrink = async (req, res) => {
  try {
    // Obtener los nuevos datos
    const { name, price, quantity, status } = req.body;

    // Buscar el drink a actualizar
    const drinkFound = await drinkModel.findById(req.params.id);

    const updatedData = {
      name,
      price,
      quantity,
      status,
    };

    // Si viene una nueva imagen
    if (req.file) {
      // Eliminar la imagen anterior de Cloudinary
      await cloudinary.uploader.destroy(drinkFound.public_id);

      // Guardar los datos de la nueva imagen
      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    // Actualizar en la base de datos
    await drinkModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    return res.status(200).json({
      message: "Drink updated successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default drinksController;