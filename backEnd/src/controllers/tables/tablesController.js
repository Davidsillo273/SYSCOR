const tablesController = {};

import tablesModel from "../../models/tables/tablesModels.js";

tablesController.getTables = async (req, res) => {
  try {
    const tables = await tablesModel.find();
    return res.status(200).json(tables);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

tablesController.insertTable = async (req, res) => {
  try {
    let { number, status } = req.body;

    let validation = validationsTables.validateNumber(number);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    validation = validationsTables.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const newTable = new tablesModel({
      number,
      status,
    });

    await newTable.save();

    return res.status(201).json({ message: "Table saved" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

tablesController.deleteTable = async (req, res) => {
  try {
    const deletedTable = await tablesModel.findByIdAndDelete(req.params.id);

    if (!deletedTable) {
      return res.status(404).json({ message: "Table not found" });
    }

    return res.status(200).json({ message: "Table deleted" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

tablesController.updateTable = async (req, res) => {
  try {
    let { number, status } = req.body;

    let validation = validationsTables.validateNumber(number);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    validation = validationsTables.validateStatus(status);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const tableUpdated = await tablesModel.findByIdAndUpdate(
      req.params.id,
      {
        number,
        status,
      },
      { new: true }
    );

    if (!tableUpdated) {
      return res.status(404).json({ message: "Table not found" });
    }

    return res.status(200).json({ message: "Table updated" });
  } catch (error) {
    console.log("error found " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default tablesController;