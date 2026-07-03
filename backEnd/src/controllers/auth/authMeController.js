
import adminModel from "../../models/users/adminModel.js";
import employeeModel from "../../models/users/employeeModel.js";
import customerModel from "../../models/users/customerModel.js";

const authMeController = {};

const MODELS_BY_ROLE = {
  admin: adminModel,
  employee: employeeModel,
  customer: customerModel,
};

// Campos a excluir siempre, sin importar el rol 
const EXCLUDED_FIELDS = "-loginInfo.password -loginInfo.loginAttempts -loginInfo.timeOut -__v";

authMeController.getMe = async (req, res) => {
  try {
    // req.user lo llena validateAuthCookie a partir del JWT decodificado
    const { id, role } = req.user;

    const model = MODELS_BY_ROLE[role];
    if (!model) {
      return res.status(400).json({ message: "Unknown user role." });
    }

    // Consultamos la BD (no solo el JWT) para que datos como nombre, imagen
    // o permisos vengan siempre actualizados, aunque el token sea viejo.
    const user = await model.findById(id).select(EXCLUDED_FIELDS);

    if (!user) {
      return res.status(401).json({ message: "Session no longer valid." });
    }

    // Respuesta homogénea entre roles: el frontend no necesita saber
    // la forma exacta de cada schema, solo lo esencial para la UI.
    return res.status(200).json({
      id: user._id,
      role,
      name: user.personalInfo?.name,
      lastname: user.personalInfo?.lastname,
      image: user.personalInfo?.image || null,
      permissions: role === "employee" ? user.permissions : undefined,
    });
  } catch (error) {
    console.error("authMeController.getMe:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default authMeController;