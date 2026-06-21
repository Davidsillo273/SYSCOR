import bcryptjs from "bcryptjs";
import adminModel from "../../../models/users/adminModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";

const registerAdminController = {};

/**
 * PASO 1 — Enviar código de verificación
 * Mismo patrón que los flujos de empleado/cliente: valida el correo,
 * verifica duplicados, genera un código, lo guarda en una cookie httpOnly
 * firmada, y lo envía por correo al usuario.
 */
registerAdminController.sendCode = async (req, res) => {
  const { email } = req.body;

  const emailValidation = utils.validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const exists = await adminModel.findOne({ "loginInfo.email": email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "An administrator with this email already exists." });
    }

    const verificationCode = emailUtils.generateVerificationCode();
    const token = emailUtils.generateToken({ email: email.toLowerCase().trim(), verificationCode }, "15m");

    res.cookie("adminVerificationToken", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    await emailUtils.sendEmail(
      email,
      "Account Verification – SYSCOR",
      emailUtils.HTMLVerificationEmail(verificationCode)
    );

    return res.status(200).json({ message: "Verification code sent to your email." });
  } catch (error) {
    console.error("registerAdminController.sendCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 2 — Verificar código
 * Valida el código escrito contra el guardado en el token, y luego mejora
 * la cookie a un token de registro con `emailVerified: true`.
 */
registerAdminController.verifyCode = async (req, res) => {
  const { code } = req.body;

  const codeValidation = utils.validateVerificationCode(code);
  if (!codeValidation.valid) {
    return res.status(400).json({ message: codeValidation.message });
  }

  try {
    const token = req.cookies.adminVerificationToken;
    if (!token) {
      return res.status(401).json({ message: "Verification session expired. Please try again." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (code.toUpperCase() !== decoded.verificationCode) {
      return res.status(400).json({ message: "The verification code is incorrect." });
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

    return res.status(200).json({ message: "Email verified. Continue with the registration." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The code has expired. Please request a new one." });
    }
    console.error("registerAdminController.verifyCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 3 — Información personal
 * Los administradores solo necesitan nombre/apellido/imagen (nada de DUI,
 * salario, dirección ni teléfono — esos campos no aplican a este rol).
 * Solo nombre/apellido se validan y se guardan en el token en este paso.
 */
registerAdminController.personalInfo = async (req, res) => {
  const {
    name,
    lastname,
    image,
  } = req.body;

  const validation = utils.runValidations([
    () => utils.validateName(name, "First name"),
    () => utils.validateName(lastname, "Last name"),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const token = req.cookies.adminRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Registration session expired. Please verify your email again." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified) {
      return res.status(401).json({ message: "The email has not been verified." });
    }

    const infoToken = emailUtils.generateToken(
      {
        email: decoded.email,
        emailVerified: true,
        personalInfo: {
          name: name.trim(),
          lastname: lastname.trim(),
          image: image || null,
        },
      },
      "30m"
    );

    res.clearCookie("adminRegistrationToken");
    res.cookie("adminRegistrationToken", infoToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Information saved. Continue with the password." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please verify your email again." });
    }
    console.error("registerAdminController.personalInfo:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 4 — Establecer contraseña y guardar
 * Valida la contraseña, vuelve a chequear duplicados, hashea la
 * contraseña, y crea el documento del administrador. Los admins quedan
 * autoautorizados y activos desde su creación (a diferencia de los
 * empleados, que necesitan aprobación explícita).
 */
registerAdminController.setPassword = async (req, res) => {
  const { password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const token = req.cookies.adminRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Registration session expired." });
    }

    const decoded = emailUtils.verifyToken(token);

    if (!decoded.emailVerified || !decoded.personalInfo) {
      return res.status(401).json({ message: "Incomplete registration. Please start over." });
    }

    const { email, personalInfo } = decoded;

    const exists = await adminModel.findOne({ "loginInfo.email": email });
    if (exists) {
      return res.status(409).json({ message: "An administrator with this email already exists." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newAdmin = new adminModel({
      personalInfo: {
        name: personalInfo.name,
        lastname: personalInfo.lastname,
        image: personalInfo.image,
      },
      loginInfo: {
        email,
        password: passwordHash,
        isVerified: true,
        loginAttempts: 0,
        timeOut: null,
      },
      // Los admins obtienen acceso total de inmediato — no requieren aprobación manual
      permissions: {
        role: "admin",
        isAuthorized: true,
        status: "active",
      }
    });

    await newAdmin.save();
    res.clearCookie("adminRegistrationToken");

    return res.status(201).json({ message: "Administrator registered successfully." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please start the registration over." });
    }
    console.error("registerAdminController.setPassword:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default registerAdminController;