const extrasController = {};

// Importamos el modelo de los extras (complementos) y sus validaciones
import extrasModel from "../../models/menu/extrasModel.js";
import validationsExtras from "../../utils/extras/validationsExtrasUtils.js";
// Utilidad para registrar los movimientos del menú como notificaciones
import notificationUtils from "../../utils/notifications/notificationUtils.js";

// Obtiene todos los complementos (extras) del menú, sin importar su estado
extrasController.getExtras = async (req, res) => {
  try {
    const extras = await extrasModel.find();
    return res.status(200).json(extras);
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Obtiene solo los complementos que están activos (disponibles para venta)
extrasController.getActiveExtras = async (req, res) => {
  try {
    const extras = await extrasModel.find({ status: "activo" });
    return res.status(200).json(extras);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Crea un nuevo complemento en el menú
extrasController.insertExtras = async (req, res) => {
  try {
    let { name, price, status } = req.body;

    // Validamos que el nombre, precio y estado tengan el formato correcto
    let validation = validationsExtras.validateName(name);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    validation = validationsExtras.validatePrice(price);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    validation = validationsExtras.validateStatus(status);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    // Creamos el nuevo complemento
    const newExtra = new extrasModel({
      name,
      price,
      status,
    });

    // Guardamos en la base de datos
    await newExtra.save();

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "created",
      title: "Extra agregado",
      message: (actor) =>
        `${actor.name} agregó el extra ${newExtra.name} al menú ($${Number(newExtra.price).toFixed(2)})`,
      icon: "star",
      severity: "success",
      entity: { model: "Extras", id: newExtra._id, label: newExtra.name },
    });

    return res.status(201).json({ message: "Extra saved" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Elimina un complemento del menú
extrasController.deleteExtra = async (req, res) => {
  try {
    const deletedExtra = await extrasModel.findByIdAndDelete(req.params.id);

    // Si no se encuentra el complemento, mostramos un error
    if (!deletedExtra) {
      return res.status(404).json({ message: "Extra not found" });
    }

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "deleted",
      title: "Extra eliminado",
      message: (actor) => `${actor.name} eliminó el extra ${deletedExtra.name} del menú`,
      icon: "trash",
      severity: "danger",
      entity: { model: "Extras", id: deletedExtra._id, label: deletedExtra.name },
    });

    return res.status(200).json({ message: "Extra deleted" });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Actualiza un complemento existente (por ejemplo, cambiarle el precio)
extrasController.updateExtra = async (req, res) => {
  try {
    let { name, price, status } = req.body;

    // Validamos los datos nuevos
    let validation = validationsExtras.validateName(name);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    validation = validationsExtras.validatePrice(price);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    validation = validationsExtras.validateStatus(status);
    if (!validation.valid) return res.status(400).json({message: validation.message});

    // Buscamos y actualizamos el complemento
    const extraUpdated = await extrasModel.findByIdAndUpdate(
      req.params.id,
      { name, price, status },
      { new: true } // Para que nos devuelva el objeto ya actualizado
    );

    if (!extraUpdated) {
      return res.status(404).json({ message: "Extra not found" });
    }

    await notificationUtils.createNotification({
      req,
      category: "menu",
      action: "updated",
      title: "Extra actualizado",
      message: (actor) =>
        `${actor.name} actualizó el extra ${extraUpdated.name} ($${Number(extraUpdated.price).toFixed(2)})`,
      icon: "star",
      severity: "info",
      entity: { model: "Extras", id: extraUpdated._id, label: extraUpdated.name },
    });

    return res.status(200).json({ message: "Extra updated" });
  } catch (error) {
    console.log("error found" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default extrasController;