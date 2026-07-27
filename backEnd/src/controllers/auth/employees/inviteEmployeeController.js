// Importamos los modelos y utilidades necesarios para gestionar empleados, enviar correos y validar datos
import employeeModel from "../../../models/users/employeeModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import invitationValidationsUtils from "../../../utils/auth/invitationValidationsUtils.js";
import notificationUtils from "../../../utils/notifications/notificationUtils.js";
import { config } from "../../../../config.js";

const inviteEmployeeController = {};

/**
 * Un Admin invita a alguien a unirse como Empleado. A diferencia de la
 * invitación de Admin, acá ya se definen los datos laborales (tipo de
 * puesto, salario, AFP, etc.) porque eso lo decide el negocio, no el
 * empleado al registrarse.
 */
inviteEmployeeController.sendInvitation = async (req, res) => {
  const {
    email,
    name,
    lastname,
    phone,
    DUI_NIT,
    address,
    type,
    salary,
    AFP,
    rent,
    additionalPay,
    workInsurance,
  } = req.body;

  const validation = utils.runValidations([
    () => utils.validateEmail(email),
    () => utils.validateName(name, "First name"),
    () => utils.validateName(lastname, "Last name"),
    () => utils.validatePhone(phone),
    () => utils.validateAddress(address),
    () => invitationValidationsUtils.validateEmployeeType(type),
    () => (AFP !== undefined ? utils.validatePositiveNumber(AFP, "AFP") : { valid: true }),
    () => (rent !== undefined ? utils.validatePositiveNumber(rent, "Rent") : { valid: true }),
    () => (additionalPay !== undefined ? utils.validatePositiveNumber(additionalPay, "Additional pay") : { valid: true }),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const exists = await employeeModel.findOne({ "loginInfo.email": normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }

    const invitationToken = emailUtils.generateToken(
      {
        email: normalizedEmail,
        role: "employee",
        invited: true,
        invitedBy: req.user?.id || null,
        personalInfo: {
          name: name.trim(),
          lastname: lastname.trim(),
          phone: phone.trim(),
          DUI_NIT: DUI_NIT.trim(),
          address: address.trim(),
          type,
        },
        workInfo: {
          salary: Number(salary),
          AFP: Number(AFP) || 0,
          rent: Number(rent) || 0,
          additionalPay: Number(additionalPay) || 0,
          workInsurance: workInsurance === true || workInsurance === "true",
        },
      },
      "24h"
    );

    const invitationLink = `${config.frontendUrl}/employee/accept-invitation?token=${invitationToken}`;

    await emailUtils.sendEmail(
      email,
      "Has sido invitado a SYSCOR",
      emailUtils.HTMLInvitationEmail(invitationLink, "Empleado")
    );

    const typeLabel = notificationUtils.EMPLOYEE_TYPE_LABELS[type] || type;

    await notificationUtils.createNotification({
      req,
      category: "staff",
      action: "invited",
      title: "Invitación enviada",
      message: (actor) =>
        `${actor.name} invitó a ${normalizedEmail} a unirse como Empleado (${typeLabel})`,
      icon: "envelope",
      severity: "info",
      entity: { model: "Employee", id: null, label: normalizedEmail },
    });

    return res.status(200).json({ message: "Invitation sent successfully." });
  } catch (error) {
    console.error("inviteEmployeeController.sendInvitation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * El invitado abre el enlace del correo; este endpoint valida el token y
 * le devuelve al frontend los datos a precargar (nombre, puesto, etc.)
 * sin exponer datos sensibles de planilla como el salario.
 */
inviteEmployeeController.validateInvitation = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Invitation token is required." });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "employee") {
      return res.status(400).json({ message: "Invalid invitation token." });
    }

    return res.status(200).json({
      email: decoded.email,
      personalInfo: {
        name: decoded.personalInfo.name,
        lastname: decoded.personalInfo.lastname,
        type: decoded.personalInfo.type,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "This invitation has expired. Ask an administrator to send a new one." });
    }
    console.error("inviteEmployeeController.validateInvitation:", error);
    return res.status(400).json({ message: "Invalid or corrupted invitation token." });
  }
};

/**
 * Paso final: el empleado invitado define su contraseña y, opcionalmente,
 * sube su foto de perfil (multipart/form-data, campo "image"). La ruta
 * debe tener upload.single("image") ANTES de este controller — ese
 * middleware ya subió el archivo a Cloudinary y dejó la URL en req.file.path.
 *
 * Todo lo demás (datos personales y laborales) viene del token firmado
 * por el admin, no del body, para que el empleado no pueda alterar su
 * propio salario o tipo de puesto durante el registro.
 *
 * isAuthorized se pone en true automáticamente, porque el hecho de venir
 * de una invitación de un admin YA es la autorización.
 */
inviteEmployeeController.acceptInvitation = async (req, res) => {
  const { token, password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "employee") {
      return res.status(400).json({ message: "Invalid invitation token." });
    }

    const exists = await employeeModel.findOne({ "loginInfo.email": decoded.email });
    if (exists) {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }

    const bcryptjs = (await import("bcryptjs")).default;
    const passwordHash = await bcryptjs.hash(password, 10);

    // req.file lo agrega multer (vía upload.single("image") en la ruta).
    // Si la ruta no tiene ese middleware, req.file siempre será undefined
    // y la imagen quedará en null sin lanzar ningún error.
    const imageUrl = req.file ? req.file.path : null;

    const newEmployee = new employeeModel({
      personalInfo: {
        name: decoded.personalInfo.name,
        lastname: decoded.personalInfo.lastname,
        DUI_NIT: decoded.personalInfo.DUI_NIT,
        address: decoded.personalInfo.address,
        phone: decoded.personalInfo.phone,
        image: imageUrl,
        type: decoded.personalInfo.type,
      },
      loginInfo: {
        email: decoded.email,
        password: passwordHash,
        isVerified: true,
        loginAttempts: 0,
        timeOut: null,
      },
      workInfo: {
        salary: decoded.workInfo.salary,
        AFP: decoded.workInfo.AFP,
        rent: decoded.workInfo.rent,
        additionalPay: decoded.workInfo.additionalPay,
        workInsurance: decoded.workInfo.workInsurance,
        isAuthorized: true,
        status: "active",
      },
    });

    await newEmployee.save();

    // Quien acepta la invitación todavía no tiene sesión, así que el actor es
    // la propia persona que acaba de registrarse.
    const fullName = `${newEmployee.personalInfo.name} ${newEmployee.personalInfo.lastname}`.trim();
    const typeLabel =
      notificationUtils.EMPLOYEE_TYPE_LABELS[newEmployee.personalInfo.type] ||
      newEmployee.personalInfo.type;

    await notificationUtils.createNotification({
      req,
      category: "staff",
      action: "registered",
      title: "Nuevo empleado",
      message: `Nuevo empleado registrado: ${fullName} (${typeLabel})`,
      icon: "user-tie",
      severity: "success",
      entity: { model: "Employee", id: newEmployee._id, label: fullName },
      actor: {
        id: newEmployee._id,
        role: "employee",
        name: fullName,
        image: newEmployee.personalInfo.image || null,
      },
    });

    return res.status(201).json({ message: "Employee account created successfully." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "This invitation has expired. Ask an administrator to send a new one." });
    }
    console.error("inviteEmployeeController.acceptInvitation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default inviteEmployeeController;