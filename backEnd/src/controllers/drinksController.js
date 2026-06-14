import drinkModel from "../models/drinksModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsDrinks from "../utils/drinks/validationsDrinksUtils.js";

// Array de funciones
const drinksController = {};

drinksController.getAllDrinks = async (req, res) => {
  try {
    const drinks = await drinkModel.find();
    return res.status(200).json(drinks);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

    return res.status(200).json({
      message: "Drink saved successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

drinksController.deleteDrink = async (req, res) => {
  try {
    const drinkFound = await drinkModel.findById(req.params.id);

    await cloudinary.uploader.destroy(drinkFound.public_id);

    await drinkModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({message: "Drink deleted successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

drinksController.updateDrink = async (req, res) => {
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

    const drinkFound = await drinkModel.findById(req.params.id);

    const updatedData = {
      name,
      price,
      quantity,
      status,
    };

    if (req.file) {
      await cloudinary.uploader.destroy(drinkFound.public_id);

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await drinkModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    return res.status(200).json({message: "Drink updated successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

export default drinksController;