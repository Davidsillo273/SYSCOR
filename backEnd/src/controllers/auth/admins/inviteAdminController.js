import adminModel from "../../../models/users/adminModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import invitationValidationsUtils from "../../../utils/auth/invitationValidationsUtils.js";
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
    () => utils.validateName(name, "First name"),
    () => utils.validateName(lastname, "Last name"),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const exists = await adminModel.findOne({ "loginInfo.email": normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "An administrator with this email already exists." });
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

    await emailUtils.sendEmail(
      email,
      "Has sido invitado a SYSCOR",
      emailUtils.HTMLInvitationEmail(invitationLink, "Administrador")
    );

    return res.status(200).json({ message: "Invitation sent successfully." });
  } catch (error) {
    console.error("inviteAdminController.sendInvitation:", error);
    return res.status(500).json({ message: "Internal server error." });
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
    return res.status(400).json({ message: "Invitation token is required." });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "admin") {
      return res.status(400).json({ message: "Invalid invitation token." });
    }

    return res.status(200).json({
      email: decoded.email,
      personalInfo: decoded.personalInfo,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "This invitation has expired. Ask an administrator to send a new one." });
    }
    console.error("inviteAdminController.validateInvitation:", error);
    return res.status(400).json({ message: "Invalid or corrupted invitation token." });
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

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const decoded = emailUtils.verifyToken(token);

    if (!decoded.invited || decoded.role !== "admin") {
      return res.status(400).json({ message: "Invalid invitation token." });
    }

    const exists = await adminModel.findOne({ "loginInfo.email": decoded.email });
    if (exists) {
      return res.status(409).json({ message: "An administrator with this email already exists." });
    }

    const bcryptjs = (await import("bcryptjs")).default;
    const passwordHash = await bcryptjs.hash(password, 10);

    // req.file lo agrega multer (vía upload.single("image") en la ruta).
    // Si la ruta no tiene ese middleware, req.file siempre será undefined
    // y la imagen quedará en null sin lanzar ningún error.
    const imageUrl = req.file ? req.file.path : null;

    const newAdmin = new adminModel({
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

    return res.status(201).json({ message: "Administrator account created successfully." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "This invitation has expired. Ask an administrator to send a new one." });
    }
    console.error("inviteAdminController.acceptInvitation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default inviteAdminController;