import inventoryModel from "../models/inventoryModel.js";
import validationsInventory from "../utils/inventory/validationsInventoryUtils.js";

const inventoryController = {};

inventoryController.getAllInventory = async (req, res) => {
  try {
    const inventory = await inventoryModel.find();

    return res.status(200).json(inventory);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

inventoryController.getInventoryById = async (req, res) => {
  try {
    const inventory = await inventoryModel.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

inventoryController.insertInventory = async (req, res) => {
  try {
    const {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    } = req.body;

    let validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUbication(ubication);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateType(type);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const newInventory = new inventoryModel({
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    });

    await newInventory.save();

    return res.status(201).json({
      message: "Product saved successfully",
      newInventory,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ELIMINAR PRODUCTO
inventoryController.deleteInventory = async (req, res) => {
  try {
    const inventoryFound = await inventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({message: "Product not found",});
    }

    await inventoryModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ACTUALIZAR PRODUCTO
inventoryController.updateInventory = async (req, res) => {
  try {
    const {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    } = req.body;

    let validation = validationsInventory.validateName(name);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validatePrice(price);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateUbication(ubication);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateQuantity(quantity);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateType(type);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    validation = validationsInventory.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({message: validation.message,});
    }

    const inventoryFound = await inventoryModel.findById(req.params.id);

    if (!inventoryFound) {
      return res.status(404).json({message: "Product not found",});
    }

    const updatedData = {
      name,
      price,
      ubication,
      quantity,
      type,
      status,
    };

    const updatedInventory = await inventoryModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Product updated successfully",updatedInventory,
    });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({message: "Internal server error"});
  }
};

export default inventoryController;