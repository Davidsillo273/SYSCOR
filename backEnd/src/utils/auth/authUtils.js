import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

export const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString("hex");
};

export const generateToken = (payload, expiresIn = "15m") => {
    return jsonwebtoken.sign(payload, config.JWT.secret, { expiresIn });
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
    },
});

export const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: config.email.user_email,
            to,
            subject,
            html: text,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error("Error enviando correo:", error);
        throw new Error("No se pudo enviar el correo");
    }
};