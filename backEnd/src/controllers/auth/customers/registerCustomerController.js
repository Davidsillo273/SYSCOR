// Importamos bcryptjs para la seguridad de contraseñas y las utilidades para el registro de clientes
import bcryptjs from "bcryptjs";
import customerModel from "../../../models/users/customerModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import customerUtils from "../../../utils/auth/customers/validationsCustomersUtils.js";
import notificationUtils from "../../../utils/notifications/notificationUtils.js";

const registerCustomerController = {};

/**
 * PASO 1 — Enviar código de verificación
 * Valida el correo, verifica que no esté ya registrado, genera un código
 * de verificación, lo guarda dentro de un JWT de corta duración (cookie
 * httpOnly), y lo envía por correo al usuario.
 */
registerCustomerController.sendCode = async (req, res) => {
  const { email } = req.body;

  // Validación básica de formato antes de tocar la base de datos
  const emailValidation = utils.validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    // Evita cuentas duplicadas
    const exists = await customerModel.findOne({ "loginInfo.email": email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Genera un código de un solo uso y lo mete en un token firmado (aún no se guarda en la DB)
    const verificationCode = emailUtils.generateVerificationCode();
    const token = emailUtils.generateToken({ email: email.toLowerCase().trim(), verificationCode }, "15m");

    // Guarda el token en una cookie httpOnly para que el cliente no pueda leerla ni modificarla
    res.cookie("customerVerificationToken", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutos, coincide con la expiración del token
    });

    // Envía el código por correo para que el usuario demuestre que es dueño de esa dirección
    await emailUtils.sendEmail(
      email,
      "Verify your account – Taquería El Corral",
      emailUtils.HTMLVerificationEmail(verificationCode)
    );

    return res.status(200).json({ message: "Verification code sent to your email." });
  } catch (error) {
    console.error("registerCustomerController.sendCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 2 — Verificar código
 * Confirma que el código que escribió el usuario coincide con el guardado
 * en el token de la cookie. Si es correcto, emite un nuevo token marcado
 * con `emailVerified: true`, que actúa como "pase" para continuar el flujo
 * de registro.
 */
registerCustomerController.verifyCode = async (req, res) => {
  const { code } = req.body;

  const codeValidation = utils.validateVerificationCode(code);
  if (!codeValidation.valid) {
    return res.status(400).json({ message: codeValidation.message });
  }

  try {
    const token = req.cookies.customerVerificationToken;
    if (!token) {
      // Si no hay cookie significa que el paso 1 nunca se completó o ya expiró
      return res.status(401).json({ message: "Verification session expired. Please try again." });
    }

    // Lanza error si está expirado/inválido — se captura abajo
    const decoded = emailUtils.verifyToken(token);

    if (code.toUpperCase() !== decoded.verificationCode) {
      return res.status(400).json({ message: "The verification code is incorrect." });
    }

    // Reemplaza la cookie de verificación por una cookie de "registro" que
    // confirma que el correo fue verificado, aún sin contener datos personales
    const verifiedToken = emailUtils.generateToken(
      { email: decoded.email, emailVerified: true },
      "30m"
    );

    res.clearCookie("customerVerificationToken");
    res.cookie("customerRegistrationToken", verifiedToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Email verified. Continue with your information." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The code has expired. Please request a new one." });
    }
    console.error("registerCustomerController.verifyCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 3 — Información personal
 * Recolecta nombre, fecha de nacimiento, teléfonos y direcciones. Tampoco
 * se escribe nada en la base de datos aquí — todo se agrega al token de
 * registro para que el flujo se mantenga sin estado entre requests del servidor.
 */
registerCustomerController.personalInfo = async (req, res) => {
  const { name, lastname, birthdate, phones, addresses, image } = req.body;

  // Arma la lista de validadores dinámicamente: birthdate/phones son
  // opcionales, así que solo se validan si el usuario realmente los envió
  const validators = [
    () => utils.validateName(name, "First name"),
    () => utils.validateName(lastname, "Last name"),
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
      return res.status(401).json({ message: "Registration session expired. Please verify your email again." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified) {
      // Chequeo defensivo: alguien intentando saltarse directo a este paso
      return res.status(401).json({ message: "The email has not been verified." });
    }

    // Normaliza las direcciones: asegura que exactamente una quede marcada
    // como default. Si el cliente no marcó ninguna, usa la primera por defecto.
    let normalizedAddresses = [];
    if (Array.isArray(addresses) && addresses.length > 0) {
      const hasDefault = addresses.some((a) => a.isDefault);
      normalizedAddresses = addresses.map((a, i) => ({
        tag: a.tag,
        details: a.details,
        isDefault: hasDefault ? a.isDefault : i === 0,
      }));
    }

    // Conserva email + emailVerified, y ahora agrega personalInfo al token
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

    // Reemplaza el token anterior por el enriquecido
    res.clearCookie("customerRegistrationToken");
    res.cookie("customerRegistrationToken", infoToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Information saved. Create your password." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please verify your email again." });
    }
    console.error("registerCustomerController.personalInfo:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PASO 4 — Establecer contraseña y guardar
 * Paso final: valida la contraseña, vuelve a chequear correos duplicados
 * (red de seguridad ante condiciones de carrera), hashea la contraseña, y
 * finalmente persiste el documento del cliente en MongoDB.
 */
registerCustomerController.setPassword = async (req, res) => {
  const { password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const token = req.cookies.customerRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Registration session expired." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified || !decoded.personalInfo) {
      // Confirma que los pasos 2 y 3 realmente se completaron antes de permitir este
      return res.status(401).json({ message: "Incomplete registration. Please start over." });
    }

    const { email, personalInfo } = decoded;

    // Vuelve a chequear que no se haya colado un duplicado mientras el usuario llenaba el formulario
    const exists = await customerModel.findOne({ "loginInfo.email": email });
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    // Este es el único lugar donde el documento se crea realmente en la DB
    const newCustomer = new customerModel({
      personalInfo: {
        name: personalInfo.name,
        lastname: personalInfo.lastname,
        image: personalInfo.image,
        birthdate: personalInfo.birthdate,
        addresses: personalInfo.addresses,
        phones: personalInfo.phones,
        cards: [], // las tarjetas se agregan después mediante el flujo de tokenización de Wompi
      },
      loginInfo: {
        email,
        password: passwordHash,
        isVerified: true, // ya se comprobó con el código de correo en el paso 2
        loginAttempts: 0,
        timeOut: null,
      },
      favorites: [],
    });

    await newCustomer.save();
    res.clearCookie("customerRegistrationToken"); // el flujo de registro terminó, se descarta el token

    // El cliente recién creado es su propio actor: todavía no ha iniciado sesión
    const fullName = `${newCustomer.personalInfo.name} ${newCustomer.personalInfo.lastname}`.trim();

    await notificationUtils.createNotification({
      req,
      category: "clients",
      action: "registered",
      title: "Nuevo cliente",
      message: `Nuevo cliente registrado: ${fullName}`,
      icon: "user-plus",
      severity: "success",
      entity: { model: "Customer", id: newCustomer._id, label: fullName },
      actor: {
        id: newCustomer._id,
        role: "customer",
        name: fullName,
        image: newCustomer.personalInfo.image || null,
      },
    });

    return res.status(201).json({ message: "Account created successfully. Welcome to Taquería El Corral!" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please start the registration over." });
    }
    console.error("registerCustomerController.setPassword:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default registerCustomerController;