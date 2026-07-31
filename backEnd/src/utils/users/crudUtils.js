// Busca usuarios (admin, empleado o cliente, según el modelo que se le pase)
// filtrando por nombre, apellido, correo o puesto. Nunca devuelve la contraseña.
const searchDocuments = async (Model, queryParams) => {
    const { name, lastname, email, type } = queryParams;
    let filter = {};

    if (name) filter["personalInfo.name"] = { $regex: name, $options: "i" };
    if (lastname) filter["personalInfo.lastname"] = { $regex: lastname, $options: "i" };
    if (email) filter["loginInfo.email"] = email.toLowerCase();

    if (type) filter["personalInfo.type"] = type;

    return await Model.find(filter).select("-loginInfo.password");
};

// Elimina un registro por su id, sin importar de qué modelo sea
const deleteDocumentById = async (Model, id) => {
    return await Model.findByIdAndDelete(id);
};

export default {
    searchDocuments,
    deleteDocumentById,
};