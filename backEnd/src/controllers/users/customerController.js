// Importamos el modelo y utilidades para poder gestionar a los clientes (customers)
import CustomerModel from "../../models/users/customerModel.js";
import crudUtils from "../../utils/users/crudUtils.js";
import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import notificationUtils from "../../utils/notifications/notificationUtils.js";

const customerController = {};

// Obtiene la lista de clientes registrados en la plataforma
customerController.getCustomers = async (req, res) => {
    try {
        const customers = await crudUtils.searchDocuments(CustomerModel, req.query);
        return res.status(200).json(customers);
    } catch (error) {
        console.error("customerController.getCustomers:", error);
        return res.status(500).json({ title: "Error del servidor", message: "No se pudo obtener la lista de clientes." });
    }
};

// Actualiza los datos de un cliente (nombre o apellidos) y lo guarda en la base de datos
customerController.updateCustomer = async (req, res) => {
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

        if (validationsToRun.length > 0) {
            const result = validationUtils.runValidations(validationsToRun);
            if (!result.valid) return res.status(400).json({ title: "Datos inválidos", message: result.message });
        }

        const updatedCustomer = await CustomerModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select("-loginInfo.password");

        if (!updatedCustomer) return res.status(404).json({ title: "Cliente no encontrado", message: "No se encontró el cliente solicitado." });

        const customerName = `${updatedCustomer.personalInfo?.name || ""} ${updatedCustomer.personalInfo?.lastname || ""}`.trim();

        await notificationUtils.createNotification({
            req,
            category: "clients",
            action: "updated",
            title: "Cliente actualizado",
            message: (actor) => `${actor.name} actualizó los datos del cliente ${customerName}`,
            icon: "user-pen",
            severity: "info",
            entity: { model: "Customer", id: updatedCustomer._id, label: customerName },
        });

        return res.status(200).json({ title: "Cliente actualizado", message: "Los datos se actualizaron correctamente.", data: updatedCustomer });
    } catch (error) {
        console.error("customerController.updateCustomer:", error);
        return res.status(500).json({ title: "Error del servidor", message: "No se pudo actualizar el cliente." });
    }
};

export default customerController;
