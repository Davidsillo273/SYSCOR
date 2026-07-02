const tablesController = {};

// Importamos el modelo de las mesas para interactuar con la base de datos
import tablesModel from "../../models/tables/tablesModels.js";

// Obtiene todas las mesas registradas en el restaurante
tablesController.getTables = async (req, res) => {
  try {
    const tables = await tablesModel.find();
    return res.status(200).json(tables);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Crea o registra una nueva mesa en el sistema
tablesController.insertTable = async (req, res) => {
  try {
    let { number, status } = req.body;

    
    // Preparamos la nueva mesa para guardarla
    const newTable = new tablesModel({
      number,
      status,
    });

    // Guardamos la mesa en la base de datos
    await newTable.save();

    return res.status(201).json({ message: "Table saved" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Elimina una mesa existente usando su ID
tablesController.deleteTable = async (req, res) => {
  try {
    const deletedTable = await tablesModel.findByIdAndDelete(req.params.id);

    // Si no encuentra la mesa, devuelve un error 404 (No encontrado)
    if (!deletedTable) {
      return res.status(404).json({ message: "Table not found" });
    }

    return res.status(200).json({ message: "Table deleted" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza los datos de una mesa (por ejemplo, para cambiarla de libre a ocupada)
tablesController.updateTable = async (req, res) => {
  try {
    let { number, status } = req.body;

  
    // Buscamos la mesa por su ID y le aplicamos los nuevos datos
    const tableUpdated = await tablesModel.findByIdAndUpdate(
      req.params.id,
      {
        number,
        status,
      },
      { new: true } // Devuelve la versión más actualizada de la mesa
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