const searchDocuments = async (Model, queryParams) => {
    const { name, lastname, email, type } = queryParams;
    let filter = {};

    if (name) filter["personalInfo.name"] = { $regex: name, $options: "i" };
    if (lastname) filter["personalInfo.lastname"] = { $regex: lastname, $options: "i" };
    if (email) filter["loginInfo.email"] = email.toLowerCase();

    if (type) filter["personalInfo.type"] = type;

    return await Model.find(filter).select("-loginInfo.password");
};

const deleteDocumentById = async (Model, id) => {
    return await Model.findByIdAndDelete(id);
};

export default {
    searchDocuments,
    deleteDocumentById,
};