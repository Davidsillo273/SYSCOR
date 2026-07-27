// Importamos el modelo de ajustes generales del sistema
import settingsModel from "../../models/settings/settingsModel.js";

// Los ajustes son un único documento global. La primera vez que alguien
// los consulta todavía no existe en la base de datos, así que lo creamos
// con los valores por defecto que ya define el schema.
const getOrCreateSettings = async () => {
    let settings = await settingsModel.findOne();

    if (!settings) {
        settings = new settingsModel({});
        await settings.save();
    }

    return settings;
};

export default { getOrCreateSettings };
