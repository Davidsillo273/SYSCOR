const extrasController = {};

import extrasModel from "../../models/menu/extrasModel.js";
import validationsExtras from "../../utils/extras/validationsExtrasUtils.js";


extrasController.getExtras = async (req, res) => {
  try {
    const extras = await extrasModel.find();
    return res.status(200).json(extras);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

extrasController.insertExtras = async (req, res) => {
  try {
    let { name, price, status } = req.body;

    let validation = validationsExtras.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsExtras.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsExtras.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const newExtra = new extrasModel({
      name,
      price,
      status,
    });

    await newExtra.save();

    return res.status(201).json({ message: "Extra saved" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

extrasController.deleteExtra = async (req, res) => {
  try {
    const deletedExtra = await extrasModel.findByIdAndDelete(
      req.params.id
    );

    if (!deletedExtra) {
      return res.status(404).json({ message: "Extra not found" });
    }

    return res.status(200).json({ message: "Extra deleted" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

extrasController.updateExtra = async (req, res) => {
  try {
    let { name, price, status } = req.body;

    let validation = validationsExtras.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsExtras.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsExtras.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const extraUpdated = await extrasModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        status,
      },
      { new: true }
    );

    if (!extraUpdated) {
      return res.status(404).json({ message: "Extra not found" });
    }

    return res.status(200).json({ message: "Extra updated" });
  } catch (error) {
    console.log("error found" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default extrasController;