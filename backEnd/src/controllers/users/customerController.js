// Importamos el modelo y utilidades para poder gestionar a los clientes (customers)
import customerModel from "../../models/users/customerModel.js";
import crudUtils from "../../utils/users/crudUtils.js";
import validationUtils from "../../utils/auth/validationsUsersUtils.js";
import notificationUtils from "../../utils/notifications/notificationUtils.js";

const customerController = {};

// Obtiene la lista de clientes registrados en la plataforma
customerController.getCustomers = async (req, res) => {
    try {
        const customers = await crudUtils.searchDocuments(customerModel, req.query);
        return res.status(200).json(customers);
    } catch (error) {
        console.error("Error getting customers:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Actualiza los datos de un cliente (nombre o apellidos) y lo guarda en la base de datos
customerController.updateCustomer = async (req, res) => {
    try {
        const { name, lastname } = req.body;
        const updateData = {};
        const validationsToRun = [];

        if (name !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(name, "Name"));
            updateData["personalInfo.name"] = name.trim();
        }
        if (lastname !== undefined) {
            validationsToRun.push(() => validationUtils.validateName(lastname, "Lastname"));
            updateData["personalInfo.lastname"] = lastname.trim();
        }

        if (validationsToRun.length > 0) {
            const result = validationUtils.runValidations(validationsToRun);
            if (!result.valid) return res.status(400).json({ message: result.message });
        }

        const updatedCustomer = await customerModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select("-loginInfo.password");

        if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });

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

        return res.status(200).json({ message: "Customer updated successfully", data: updatedCustomer });
    } catch (error) {
        console.error("Error updating customer:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default customerController;