//Array de funciones
const extrasController = {};

//Importo la colección que voy a ocupar
import extrasModel from "../models/extrasModel.js";

//SELECT
extrasController.getExtras = async (req, res) => {
  try {
    const extras = await extrasModel.find();
    return res.status(200).json(extras);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//INSERT
extrasController.insertExtras = async (req, res) => {
  try {
    //#1- Solicitamos los datos
    let { name, price, status } = req.body;

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

//ELIMINAR
extrasController.deleteExtra = async (req, res) => {
  try {
    const deletedExtra = await extrasModel.findByIdAndDelete(
      req.params.id,
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

//ACTUALIZAR
extrasController.updateExtra = async (req, res) => {
  try {
    //#1- Solicitamos los datos
    let { name, price, status } = req.body;

    const extraUpdated = await extrasModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        status,
      },
      { new: true },
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
