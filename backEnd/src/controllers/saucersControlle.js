import saucersModel from "../models/saucersModel.js";
import { v2 as cloudinary } from "cloudinary";
import validationsSaucers from "../utils/saucers/validationsSaucersUtils.js";

const saucersController = {};

saucersController.getAllSaucers = async (req, res) => {
  try {
    const saucers = await saucersModel.find();
    return res.status(200).json(saucers);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

    return res.status(200).json({message: "Saucer saved successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error"});
  }
};

saucersController.deleteSaucer = async (req, res) => {
  try {
    const saucerFound = await saucersModel.findById(req.params.id);

    await cloudinary.uploader.destroy(saucerFound.public_id);

    await saucersModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({message: "Saucer deleted successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

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

    if (req.file) {
      await cloudinary.uploader.destroy(saucerFound.public_id);

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await saucersModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    return res.status(200).json({message: "Saucer updated successfully",});
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error",});
  }
};

export default saucersController;