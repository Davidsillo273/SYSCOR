import SettingsModel from "../../models/settings/settingsModel.js";

// Los ajustes son un único documento global. La primera vez que alguien
// los consulta todavía no existe en la base de datos, así que lo creamos
// con los valores por defecto que ya define el schema.
const getOrCreateSettings = async () => {
    let settings = await SettingsModel.findOne();

    if (!settings) {
        settings = new SettingsModel({});
        await settings.save();
    }

    return settings;
};

export default { getOrCreateSettings };
