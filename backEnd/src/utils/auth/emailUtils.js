import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

const generateToken = (payload, expiresIn = "15m") => {
  return jsonwebtoken.sign(payload, config.JWT.secret, { expiresIn });
};

const verifyToken = (token) => {
  return jsonwebtoken.verify(token, config.JWT.secret);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.user_email,
    pass: config.email.user_password,
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"SYSCOR – Taquería El Corral" <${config.email.user_email}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("sendEmail error:", error);
    throw new Error("No se pudo enviar el correo de verificación.");
  }
};

const HTMLVerificationEmail = (code) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#B22222;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;"> SYSCOR</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Taquería El Corral</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;text-align:center;">
              <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:20px;">Verifica tu correo</h2>
              <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
                Usa el siguiente código para completar tu registro. Expira en <strong>15 minutos</strong>.
              </p>
              <div style="display:inline-block;background:#f9f1e7;border:2px dashed #B22222;
                          border-radius:8px;padding:20px 48px;margin-bottom:32px;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#B22222;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;color:#888;font-size:13px;">
                Si no solicitaste esto, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:16px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;">© 2025 Taquería El Corral · SYSCOR</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
const HTMLRecoveryEmail = (code) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#B22222;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;"> SYSCOR</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Taquería El Corral</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;text-align:center;">
              <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:20px;">Recuperación de contraseña</h2>
              <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
                Usa el siguiente código para restablecer tu contraseña. Expira en <strong>15 minutos</strong>.
              </p>
              <div style="display:inline-block;background:#f9f1e7;border:2px dashed #B22222;
                          border-radius:8px;padding:20px 48px;margin-bottom:32px;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#B22222;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;color:#888;font-size:13px;">
                Si no solicitaste este cambio, por favor ignora este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:16px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;">© 2026 Taquería El Corral · SYSCOR</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default {
  generateVerificationCode,
  generateToken,
  verifyToken,
  sendEmail,
  HTMLVerificationEmail,
  HTMLRecoveryEmail
};