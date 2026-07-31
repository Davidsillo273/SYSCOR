// Importamos el modelo y utilidades para poder buscar y validar administradores
import AdminModel from "../../models/users/adminModel.js";
import crudUtils from "../../utils/users/crudUtils.js";
import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import cloudinaryUtils from "../../utils/cloudinaryUtils.js";

const adminController = {};

// Obtiene la lista de todos los administradores registrados
adminController.getAdmins = async (req, res) => {
    try {
        const admins = await crudUtils.searchDocuments(AdminModel, req.query);
        return res.status(200).json(admins);
    } catch (error) {
        console.error("adminController.getAdmins:", error);
        return res.status(500).json({ title: "Error del servidor", message: "No se pudo obtener la lista de administradores." });
    }
};

// Actualiza los datos de un administrador (como su nombre, apellido o foto de perfil)
adminController.updateAdmin = async (req, res) => {
    try {
        const { name, lastname } = req.body;
        const updateData = {};
        const validationsToRun = [];

        if (name !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(name, "El nombre"));
            updateData["personalInfo.name"] = name.trim();
        }
        if (lastname !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(lastname, "El apellido"));
            updateData["personalInfo.lastname"] = lastname.trim();
        }

        // req.file lo agrega multer (la ruta debe tener upload.single("image")).
        // Solo se actualiza la imagen si efectivamente se mandó un archivo
        // nuevo — si no, el campo image existente en la DB no se toca.
        if (req.file) {
            updateData["personalInfo.image"] = req.file.path;
        }

        if (validationsToRun.length > 0) {
            const result = validationUtils.runValidations(validationsToRun);
            if (!result.valid) return res.status(400).json({ title: "Datos inválidos", message: result.message });
        }

        // Si viene una foto nueva, guardamos la URL de la anterior para
        // borrarla de Cloudinary después de que la actualización tenga éxito
        let previousImage = null;
        if (req.file) {
            const currentAdmin = await AdminModel.findById(req.params.id).select("personalInfo.image");
            previousImage = currentAdmin?.personalInfo?.image || null;
        }

        const updatedAdmin = await AdminModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-loginInfo.password");

        if (!updatedAdmin) return res.status(404).json({ title: "Administrador no encontrado", message: "No se encontró el administrador solicitado." });

        // La imagen anterior ya no la usa nadie, la eliminamos de Cloudinary
        if (previousImage) {
            await cloudinaryUtils.deletePreviousImage(previousImage);
        }

        return res.status(200).json({ title: "Administrador actualizado", message: "Los datos se actualizaron correctamente.", data: updatedAdmin });
    } catch (error) {
        console.error("adminController.updateAdmin:", error);
        return res.status(500).json({ title: "Error del servidor", message: "No se pudo actualizar el administrador." });
    }
};

export default adminController;
