import express from "express";
import registerCustomerController from "../../../controllers/auth/customers/registerCustomerController.js";

const router = express.Router();

/**
 * @swagger
 * /auth/customers/register/send-code:
 *   post:
 *     summary: "Paso 1 de registro: envía un código de verificación al correo"
 *     description: Público. Valida el formato del correo, confirma que no exista ya una cuenta, y envía un código de un solo uso por correo (guardado en la cookie httpOnly customerVerificationToken).
 *     tags: [Auth - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "cliente@correo.com" }
 *     responses:
 *       200:
 *         description: Código enviado al correo indicado.
 *       400:
 *         description: Correo con formato inválido.
 *       409:
 *         description: Ya existe una cuenta registrada con ese correo.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/send-code", registerCustomerController.sendCode);

/**
 * @swagger
 * /auth/customers/register/verify-code:
 *   post:
 *     summary: "Paso 2 de registro: verifica el código enviado por correo"
 *     description: Público. Compara el código ingresado con el guardado en la cookie customerVerificationToken. Si es correcto, emite la cookie customerRegistrationToken para continuar el flujo.
 *     tags: [Auth - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "A1B2C3" }
 *     responses:
 *       200:
 *         description: Correo verificado; se emitió la cookie de registro para el siguiente paso.
 *       400:
 *         description: Código con formato inválido o código incorrecto.
 *       401:
 *         description: No existe la cookie de verificación (expiró o nunca se completó el paso 1) o el código venció.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/verify-code", registerCustomerController.verifyCode);

/**
 * @swagger
 * /auth/customers/register/personal-info:
 *   post:
 *     summary: "Paso 3 de registro: datos personales del cliente"
 *     description: Público (requiere la cookie customerRegistrationToken del paso anterior con emailVerified=true). Guarda nombre, apellido, fecha de nacimiento, teléfonos y direcciones dentro del token de registro, sin escribir nada aún en la base de datos.
 *     tags: [Auth - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastname]
 *             properties:
 *               name: { type: string, example: "Juan" }
 *               lastname: { type: string, example: "Pérez" }
 *               birthdate: { type: string, example: "1998-05-20" }
 *               phones:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["7000-1234"]
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tag: { type: string, example: "Casa" }
 *                     details: { type: string, example: "Col. Escalón, San Salvador" }
 *                     isDefault: { type: boolean, example: true }
 *               image: { type: string, example: null, nullable: true }
 *     responses:
 *       200:
 *         description: Datos personales guardados en el token de registro.
 *       400:
 *         description: Nombre/apellido/fecha de nacimiento/teléfonos inválidos.
 *       401:
 *         description: No existe la cookie de registro, expiró, o el correo aún no fue verificado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/personal-info", registerCustomerController.personalInfo);

/**
 * @swagger
 * /auth/customers/register/set-password:
 *   post:
 *     summary: "Paso 4 de registro: define la contraseña y crea la cuenta"
 *     description: Público (requiere la cookie customerRegistrationToken con emailVerified=true y personalInfo ya completados). Valida la contraseña, vuelve a chequear correos duplicados y crea el documento del cliente en la base de datos.
 *     tags: [Auth - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: "MiClave#123" }
 *     responses:
 *       201:
 *         description: Cuenta de cliente creada correctamente.
 *       400:
 *         description: Contraseña que no cumple las reglas mínimas.
 *       401:
 *         description: No existe la cookie de registro, expiró, o el registro está incompleto (faltan pasos previos).
 *       409:
 *         description: Ya existe una cuenta registrada con ese correo (condición de carrera).
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/set-password", registerCustomerController.setPassword);

export default router;
