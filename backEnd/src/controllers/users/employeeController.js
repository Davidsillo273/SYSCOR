// Importamos el modelo y las utilidades para consultar y validar la información de empleados
import employeeModel from "../../models/users/employeeModel.js";
import crudUtils from "../../utils/users/crudUtils.js";
import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import invitationValidationsUtils from "../../utils/auth/invitationValidationsUtils.js";
import notificationUtils from "../../utils/notifications/notificationUtils.js";
import cloudinaryUtils from "../../utils/cloudinaryUtils.js";

const employeeController = {};

// Obtiene la lista de todos los empleados
employeeController.getEmployees = async (req, res) => {
    try {
        const employees = await crudUtils.searchDocuments(employeeModel, req.query);
        return res.status(200).json(employees);
    } catch (error) {
        console.error("Error getting employees:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Actualiza los datos de un empleado (nombre, apellido, teléfono, dirección, tipo de rol, salario o imagen)
employeeController.updateEmployee = async (req, res) => {
    try {
        const { name, lastname, phone, address, type, salary, shift, schedule } = req.body;
        const updateData = {};
        const validationsToRun = [];

        // Mapeo dinámico y validaciones
        if (name !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(name, "Name"));
            updateData["personalInfo.name"] = name.trim();
        }
        if (lastname !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(lastname, "Lastname"));
            updateData["personalInfo.lastname"] = lastname.trim();
        }
        if (phone !== undefined) {
            validationsToRun.push(() => validationUtils.validatePhone(phone));
            updateData["personalInfo.phone"] = phone.trim();
        }
        if (address !== undefined) {
            validationsToRun.push(() => validationUtils.validateAddress(address));
            updateData["personalInfo.address"] = address.trim();
        }
        if (type !== undefined) {
            validationsToRun.push(() => invitationValidationsUtils.validateEmployeeType(type));
            updateData["personalInfo.type"] = type;
        }
        if (salary !== undefined) {
            validationsToRun.push(() => validationUtils.validatePositiveNumber(salary, "Salary"));
            updateData["workInfo.salary"] = Number(salary);
        }
        if (shift !== undefined) {
            validationsToRun.push(() =>
                typeof shift === "string" && shift.trim().length > 0
                    ? { valid: true }
                    : { valid: false, message: "Shift must be a non-empty string." }
            );
            updateData["workInfo.shift"] = typeof shift === "string" ? shift.trim() : shift;
        }
        if (schedule !== undefined) {
            validationsToRun.push(() =>
                typeof schedule === "string" && schedule.trim().length > 0
                    ? { valid: true }
                    : { valid: false, message: "Schedule must be a non-empty string." }
            );
            updateData["workInfo.schedule"] = typeof schedule === "string" ? schedule.trim() : schedule;
        }

        // req.file lo agrega multer (la ruta debe tener upload.single("image")).
        // Solo se actualiza la imagen si efectivamente se mandó un archivo
        // nuevo — si no, el campo image existente en la DB no se toca.
        if (req.file) {
            updateData["personalInfo.image"] = req.file.path;
        }

        // Ejecutar todas las validaciones acumuladas
        if (validationsToRun.length > 0) {
            const result = validationUtils.runValidations(validationsToRun);
            if (!result.valid) return res.status(400).json({ message: result.message });
        }

        // Si viene una foto nueva, guardamos la URL de la anterior para
        // borrarla de Cloudinary después de que la actualización tenga éxito
        let previousImage = null;
        if (req.file) {
            const currentEmployee = await employeeModel.findById(req.params.id).select("personalInfo.image");
            previousImage = currentEmployee?.personalInfo?.image || null;
        }

        const updatedEmployee = await employeeModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-loginInfo.password");

        if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });

        // La imagen anterior ya no la usa nadie, la eliminamos de Cloudinary
        if (previousImage) {
            await cloudinaryUtils.deletePreviousImage(previousImage);
        }

        const employeeName = `${updatedEmployee.personalInfo?.name || ""} ${updatedEmployee.personalInfo?.lastname || ""}`.trim();

        await notificationUtils.createNotification({
            req,
            category: "staff",
            action: "updated",
            title: "Perfil de empleado actualizado",
            // Si alguien edita su propia ficha lo redactamos distinto, para que se entienda
            message: (actor) =>
                actor.id?.toString() === updatedEmployee._id.toString()
                    ? `${actor.name} actualizó su propio perfil`
                    : `${actor.name} actualizó el perfil de ${employeeName}`,
            icon: "user-pen",
            severity: "info",
            entity: { model: "Employee", id: updatedEmployee._id, label: employeeName },
        });

        return res.status(200).json({ message: "Employee updated successfully", data: updatedEmployee });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default employeeController;