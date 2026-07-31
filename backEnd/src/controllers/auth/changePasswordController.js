// Importamos bcryptjs para comparar y cifrar contraseñas, los modelos de cada
// tipo de usuario y las validaciones de contraseña ya existentes
import bcryptjs from "bcryptjs";
import AdminModel from "../../models/users/adminModel.js";
import EmployeeModel from "../../models/users/employeeModel.js";
import CustomerModel from "../../models/users/customerModel.js";
import utils from "../../utils/auth/validationsUsersUtils.js";

const changePasswordController = {};

// Según el rol sabemos en qué colección está guardado el usuario
const MODELS_BY_ROLE = {
  admin: AdminModel,
  employee: EmployeeModel,
  customer: CustomerModel,
};

/**
 * Permite que un usuario con sesión activa cambie su propia contraseña.
 *
 * Es distinto al flujo de "recuperar contraseña": ahí el usuario olvidó su
 * clave y se verifica por correo. Aquí ya está dentro del sistema, así que
 * le pedimos la contraseña actual como prueba de identidad.
 */
changePasswordController.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    if (!currentPassword) {
      return res.status(400).json({ title: "Contraseña requerida", message: "Debes ingresar tu contraseña actual." });
    }

    // La contraseña nueva debe cumplir las mismas reglas que al registrarse
    const passwordValidation = utils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ title: "Contraseña inválida", message: passwordValidation.message });
    }

    const model = MODELS_BY_ROLE[role];
    if (!model) {
      return res.status(400).json({ title: "Rol desconocido", message: "El rol del usuario no es válido." });
    }

    const user = await model.findById(id);
    if (!user) {
      return res.status(401).json({ title: "Sesión inválida", message: "Tu sesión ya no es válida. Inicia sesión nuevamente." });
    }

    // Comprobamos que quien pide el cambio realmente conoce la contraseña actual
    const isMatch = await bcryptjs.compare(currentPassword, user.loginInfo.password);
    if (!isMatch) {
      return res.status(401).json({ title: "Contraseña incorrecta", message: "La contraseña actual no es correcta." });
    }

    // Evitamos que se "cambie" por la misma de siempre
    const isSamePassword = await bcryptjs.compare(newPassword, user.loginInfo.password);
    if (isSamePassword) {
      return res.status(400).json({ title: "Contraseña repetida", message: "La nueva contraseña debe ser diferente a la actual." });
    }

    user.loginInfo.password = await bcryptjs.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ title: "Contraseña actualizada", message: "Tu contraseña se actualizó correctamente." });
  } catch (error) {
    console.error("changePasswordController.changePassword:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al cambiar la contraseña." });
  }
};

export default changePasswordController;
