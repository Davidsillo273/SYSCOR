import bcryptjs from "bcryptjs";
import employeeModel from "../../../models/employeeModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import customersUtils from "../../../utils/auth/customers/validationsCustomersUtils.js";

const registerCustomerController = {};

registerCustomerController.sendCode = async (req, res) => {
  const { email } = req.body;

  const emailValidation = utils.validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const exists = await customerModel.findOne({ "loginInfo.email": email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "Ya existe una cuenta con ese correo." });
    }

    const verificationCode = emailUtils.generateVerificationCode();
    const token = emailUtils.generateToken({ email: email.toLowerCase().trim(), verificationCode }, "15m");

    res.cookie("customerVerificationToken", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    await emailUtils.sendEmail(
      email,
      "Verifica tu cuenta – Taquería El Corral",
      emailUtils.HTMLVerificationEmail(verificationCode)
    );

    return res.status(200).json({ message: "Código de verificación enviado al correo." });
  } catch (error) {
    console.error("registerCustomerController.sendCode:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerCustomerController.verifyCode = async (req, res) => {
  const { code } = req.body;

  const codeValidation = utils.validateVerificationCode(code);
  if (!codeValidation.valid) {
    return res.status(400).json({ message: codeValidation.message });
  }

  try {
    const token = req.cookies.customerVerificationToken;
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

    res.clearCookie("customerVerificationToken");
    res.cookie("customerRegistrationToken", verifiedToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Correo verificado. Continúa con tu información." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "El código ha expirado. Solicita uno nuevo." });
    }
    console.error("registerCustomerController.verifyCode:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerCustomerController.personalInfo = async (req, res) => {
  const { name, lastname, birthdate, phones, addresses, image } = req.body;

  const validators = [
    () => utils.validateName(name, "El nombre"),
    () => utils.validateName(lastname, "El apellido"),
  ];

  if (birthdate) validators.push(() => customerUtils.validateBirthdate(birthdate));
  if (phones && phones.length > 0) validators.push(() => customerUtils.validatePhones(phones));

  const validation = utils.runValidations(validators);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const token = req.cookies.customerRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Sesión de registro expirada. Verifica tu correo de nuevo." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified) {
      return res.status(401).json({ message: "El correo no ha sido verificado." });
    }

    let normalizedAddresses = [];
    if (Array.isArray(addresses) && addresses.length > 0) {
      const hasDefault = addresses.some((a) => a.isDefault);
      normalizedAddresses = addresses.map((a, i) => ({
        tag: a.tag,
        details: a.details,
        isDefault: hasDefault ? a.isDefault : i === 0,
      }));
    }

    const infoToken = emailUtils.generateToken(
      {
        email: decoded.email,
        emailVerified: true,
        personalInfo: {
          name: name.trim(),
          lastname: lastname.trim(),
          image: image || null,
          birthdate: birthdate || null,
          phones: phones || [],
          addresses: normalizedAddresses,
        },
      },
      "30m"
    );

    res.clearCookie("customerRegistrationToken");
    res.cookie("customerRegistrationToken", infoToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Información guardada. Crea tu contraseña." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesión expirada. Verifica tu correo de nuevo." });
    }
    console.error("registerCustomerController.personalInfo:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

registerCustomerController.setPassword = async (req, res) => {
  const { password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const token = req.cookies.customerRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Sesión de registro expirada." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified || !decoded.personalInfo) {
      return res.status(401).json({ message: "Registro incompleto. Empieza de nuevo." });
    }

    const { email, personalInfo } = decoded;

    const exists = await customerModel.findOne({ "loginInfo.email": email });
    if (exists) {
      return res.status(409).json({ message: "Ya existe una cuenta con ese correo." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newCustomer = new customerModel({
      personalInfo: {
        name: personalInfo.name,
        lastname: personalInfo.lastname,
        image: personalInfo.image,
        birthdate: personalInfo.birthdate,
        addresses: personalInfo.addresses,
        phones: personalInfo.phones,
        cards: [],
      },
      loginInfo: {
        email,
        password: passwordHash,
        isVerified: true,
        loginAttempts: 0,
        timeOut: null,
      },
      favorites: [],
    });

    await newCustomer.save();
    res.clearCookie("customerRegistrationToken");

    return res.status(201).json({ message: "Cuenta creada exitosamente. ¡Bienvenido a Taquería El Corral!" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesión expirada. Empieza el registro de nuevo." });
    }
    console.error("registerCustomerController.setPassword:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export default registerCustomerController;