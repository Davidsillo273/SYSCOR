import bcryptjs from "bcryptjs";
import adminModel from "../../../models/adminModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import employeeUtils from "../../../utils/auth/employees/validationsEmployeesUtils.js";

const registerAdminController = {};

registerAdminController.sendCode = async (req, res) => {
  const { email } = req.body;

  const emailValidation = utils.validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const exists = await adminModel.findOne({ "loginInfo.email": email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "Ya existe un administrador con ese correo." });
    }

    const verificationCode = emailUtils.generateVerificationCode();
    const token = emailUtils.generateToken({ email: email.toLowerCase().trim(), verificationCode }, "15m");

    res.cookie("adminVerificationToken", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    await emailUtils.sendEmail(
      email,
      "Verificación de cuenta – SYSCOR",
      emailUtils.HTMLVerificationEmail(verificationCode)
    );

    return res.status(200).json({ message: "Código de verificación enviado al correo." });
  } catch (error) {
    console.error("registerAdminController.sendCode:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerAdminController.verifyCode = async (req, res) => {
  const { code } = req.body;

  const codeValidation = utils.validateVerificationCode(code);
  if (!codeValidation.valid) {
    return res.status(400).json({ message: codeValidation.message });
  }

  try {
    const token = req.cookies.adminVerificationToken;
    if (!token) {
      return res.status(401).json({ message: "Sesión de verificación expirada. Intenta de nuevo." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (code.toUpperCase() !== decoded.verificationCode) {
      return res.status(400).json({ message: "El código de verificación no es correcto." });
    }

    const verifiedToken = emailUtils.generateToken(
      { email: decoded.email, emailVerified: true },
      "30m"
    );

    res.clearCookie("adminVerificationToken");
    res.cookie("adminRegistrationToken", verifiedToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Correo verificado. Continúa con el registro." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "El código ha expirado. Solicita uno nuevo." });
    }
    console.error("registerAdminController.verifyCode:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerAdminController.personalInfo = async (req, res) => {
  const {
    name,
    lastname,
    DUI_NIT,
    address,
    phone,
    type,
    image,
    salary,
    AFP,
    rent,
    additionalPay,
    workInsurance,
  } = req.body;

  const validation = utils.runValidations([
    () => utils.validateName(name, "El nombre"),
    () => utils.validateName(lastname, "El apellido"),
    () => employeeUtils.validateDUI_NIT(DUI_NIT),
    () => utils.validateAddress(address),
    () => utils.validatePhone(phone),
    () => employeeUtils.validateEmployeeType(type),
    () => employeeUtils.validateSalary(salary),
    () => (AFP !== undefined ? utils.validatePositiveNumber(AFP, "El AFP") : { valid: true }),
    () => (rent !== undefined ? utils.validatePositiveNumber(rent, "El rent") : { valid: true }),
    () => (additionalPay !== undefined ? utils.validatePositiveNumber(additionalPay, "El pago adicional") : { valid: true }),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const token = req.cookies.adminRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Sesión de registro expirada. Verifica tu correo de nuevo." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified) {
      return res.status(401).json({ message: "El correo no ha sido verificado." });
    }

    const infoToken = emailUtils.generateToken(
      {
        email: decoded.email,
        emailVerified: true,
        personalInfo: {
          name: name.trim(),
          lastname: lastname.trim(),
          DUI_NIT: DUI_NIT.trim(),
          address: address.trim(),
          phone: phone.trim(),
          type,
          image: image || null,
        },
        workInfo: {
          salary: Number(salary),
          AFP: Number(AFP) || 0,
          rent: Number(rent) || 0,
          additionalPay: Number(additionalPay) || 0,
          workInsurance: workInsurance === true || workInsurance === "true",
        },
      },
      "30m"
    );

    res.clearCookie("adminRegistrationToken");
    res.cookie("adminRegistrationToken", infoToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Información guardada. Continúa con la contraseña." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesión expirada. Verifica tu correo de nuevo." });
    }
    console.error("registerAdminController.personalInfo:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerAdminController.setPassword = async (req, res) => {
  const { password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const token = req.cookies.adminRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Sesión de registro expirada." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified || !decoded.personalInfo || !decoded.workInfo) {
      return res.status(401).json({ message: "Registro incompleto. Empieza de nuevo." });
    }

    const { email, personalInfo, workInfo } = decoded;

    const exists = await adminModel.findOne({ "loginInfo.email": email });
    if (exists) {
      return res.status(409).json({ message: "Ya existe un administrador con ese correo." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newAdmin = new adminModel({
      personalInfo: {
        name: personalInfo.name,
        lastname: personalInfo.lastname,
        DUI_NIT: personalInfo.DUI_NIT,
        address: personalInfo.address,
        phone: personalInfo.phone,
        image: personalInfo.image,
        type: personalInfo.type,
      },
      loginInfo: {
        email,
        password: passwordHash,
        isVerified: true,
        loginAttempts: 0,
        timeOut: null,
      },
      workInfo: {
        salary: workInfo.salary,
        AFP: workInfo.AFP,
        rent: workInfo.rent,
        additionalPay: workInfo.additionalPay,
        workInsurance: workInfo.workInsurance,
        isAuthorized: false,
        status: "active",
      },
    });

    await newAdmin.save();
    res.clearCookie("adminRegistrationToken");

    return res.status(201).json({ message: "Administrador registrado exitosamente." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesión expirada. Empieza el registro de nuevo." });
    }
    console.error("registerAdminController.setPassword:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export default registerAdminController;