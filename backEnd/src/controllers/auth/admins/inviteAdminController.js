// Importamos los modelos y utilidades necesarias para gestionar invitaciones y envíos de correo
import AdminModel from "../../../models/users/adminModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import notificationUtils from "../../../utils/notifications/notificationUtils.js";
import { config } from "../../../../config.js";

const inviteAdminController = {};

/**
 * Un Admin existente invita a otra persona a convertirse en Admin.
 * No se crea ningún documento en la DB todavía — solo se manda el correo
 * con un token firmado que contiene los datos básicos. El destinatario
 * completa su propio registro (incluyendo la contraseña y, opcionalmente,
 * la foto de perfil) al hacer clic en el enlace.
 *
 * Requiere middleware de autenticación + autorización de rol "admin" en
 * la ruta correspondiente (este controller asume que ya pasó esa validación).
 */
inviteAdminController.sendInvitation = async (req, res) => {
  const { email, name, lastname } = req.body;

  const validation = utils.runValidations([
    () => utils.validateEmail(email),
    () => utils.validateName(name, "El nombre"),
    () => utils.validateName(lastname, "El apellido"),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ title: "Datos inválidos", message: validation.message });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Si ya existe un admin con ese correo, no tiene sentido invitarlo de nuevo
    const exists = await AdminModel.findOne({ "loginInfo.email": normalizedEmail });
    if (exists) {
      return res.status(409).json({ title: "Administrador ya existe", message: "Ya existe un administrador registrado con este correo electrónico." });
    }

    // El token lleva todo lo necesario para el registro, excepto la
    // contraseña y la imagen (eso lo define el invitado en el último paso)
    const invitationToken = emailUtils.generateToken(
      {
        email: normalizedEmail,
        role: "admin",
        invited: true,
        invitedBy: req.user?.id || null, // disponible si tu middleware de auth adjunta req.user
        personalInfo: {
          name: name.trim(),
          lastname: lastname.trim(),
        },
      },
      "24h"
    );

    const invitationLink = `${config.frontendUrl}/admin/accept-invitation?token=${invitationToken}`;

    // Le mandamos el correo con el enlace antes de confirmar nada al admin
    await emailUtils.sendEmail(
      email,
      "Has sido invitado a SYSCOR",
      emailUtils.htmlInvitationEmail(invitationLink, "Administrador")
    );

    await notificationUtils.createNotification({
      req,
      category: "staff",
      action: "invited",
      title: "Invitación enviada",
      message: (actor) =>
        `${actor.name} invitó a ${normalizedEmail} a unirse como Administrador`,
      icon: "envelope",
      severity: "warning",
      entity: { model: "Admin", id: null, label: normalizedEmail },
    });

    return res.status(200).json({ title: "Invitación enviada", message: "La invitación se envió correctamente al correo indicado." });
  } catch (error) {
    console.error("inviteAdminController.sendInvitation:", error);
    return res.status(500).json({ title: "Error del servidor", message: "Ocurrió un problema interno al enviar la invitación." });
  }
};

/**
 * El invitado hace clic en el enlace del correo y llega aquí con el token.
 * Este endpoint solo valida y "abre" el token para que el frontend sepa
 * qué datos precargar (nombre, apellido) y le pida la contraseña.
 * No guarda nada en la DB todavía.
 */
inviteAdminController.validateInvitation = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ title: "Token requerido", message: "El token de invitación es requerido." });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "admin") {
      return res.status(400).json({ title: "Token inválido", message: "El token de invitación no es válido." });
    }

    return res.status(200).json({
      email: decoded.email,
      personalInfo: decoded.personalInfo,
    });
  } catch (error) {
    // Si el token venció, se lo decimos explícito para que pida uno nuevo
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ title: "Invitación expirada", message: "Esta invitación ya venció. Pide a un administrador que envíe una nueva." });
    }
    console.error("inviteAdminController.validateInvitation:", error);
    return res.status(400).json({ title: "Token inválido", message: "El token de invitación no es válido o está dañado." });
  }
};

/**
 * Paso final: el invitado define su contraseña y, opcionalmente, sube su
 * foto de perfil (multipart/form-data, campo "image"). La ruta debe tener
 * el middleware upload.single("image") ANTES de este controller — ese
 * middleware ya subió el archivo a Cloudinary y dejó la URL en req.file.path.
 *
 * El email/personalInfo vienen directamente del token firmado, no del
 * body — así el frontend no puede inyectar datos distintos a los que el
 * admin originalmente invitó.
 */
inviteAdminController.acceptInvitation = async (req, res) => {
  const { token, password } = req.body;

  // La contraseña la escribe el invitado en este paso, así que se valida aquí
  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ title: "Contraseña inválida", message: passwordValidation.message });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "admin") {
      return res.status(400).json({ title: "Token inválido", message: "El token de invitación no es válido." });
    }

    const exists = await AdminModel.findOne({ "loginInfo.email": decoded.email });
    if (exists) {
      return res.status(409).json({ title: "Administrador ya existe", message: "Ya existe un administrador registrado con este correo electrónico." });
    }

    const bcryptjs = (await import("bcryptjs")).default;
    const passwordHash = await bcryptjs.hash(password, 10);

    // req.file lo agrega multer (vía upload.single("image") en la ruta).
    // Si la ruta no tiene ese middleware, req.file siempre será undefined
    // y la imagen quedará en null sin lanzar ningún error.
    const imageUrl = req.file ? req.file.path : null;

    const newAdmin = new AdminModel({
      personalInfo: {
        name: decoded.personalInfo.name,
        lastname: decoded.personalInfo.lastname,
        image: imageUrl,
      },
      loginInfo: {
        email: decoded.email,
        password: passwordHash,
        isVerified: true,
        loginAttempts: 0,
        timeOut: null,
      },
      permissions: {
        role: "admin",
        isAuthorized: true,
        status: "active",
      },
    });

    await newAdmin.save();

    // El nuevo administrador todavía no tiene sesión: él mismo es el actor
    const fullName = `${newAdmin.personalInfo.name} ${newAdmin.personalInfo.lastname}`.trim();

    await notificationUtils.createNotification({
      req,
      category: "staff",
      action: "registered",
      title: "Nuevo administrador",
      message: `Nuevo administrador registrado: ${fullName}`,
      icon: "user-shield",
      severity: "warning",
      entity: { model: "Admin", id: newAdmin._id, label: fullName },
      actor: {
        id: newAdmin._id,
        role: "admin",
        name: fullName,
        image: newAdmin.personalInfo.image || null,
      },
    });

    return res.status(201).json({ title: "Cuenta creada", message: "La cuenta del administrador se creó correctamente." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ title: "Invitación expirada", message: "Esta invitación ya venció. Pide a un administrador que envíe una nueva." });
    }
    console.error("inviteAdminController.acceptInvitation:", error);
    return res.status(500).json({ title: "Error del servidor", message: "No se pudo crear la cuenta del administrador." });
  }
};

export default inviteAdminController;
