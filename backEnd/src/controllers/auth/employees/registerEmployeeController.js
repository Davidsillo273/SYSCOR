import bcryptjs from "bcryptjs";
import employeeModel from "../../../models/employeeModel.js";
import emailUtils from "../../../utils/auth/emailUtils.js";
import utils from "../../../utils/auth/validationsUsersUtils.js";
import employeeUtils from "../../../utils/auth/employees/validationsEmployeesUtils.js";

const registerEmployeeController = {};

registerEmployeeController.sendCode = async (req, res) => {
  const { email } = req.body;

  const emailValidation = utils.validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }

  try {
    const exists = await employeeModel.findOne({ "loginInfo.email": email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }

    const verificationCode = emailUtils.generateVerificationCode();
    const token = emailUtils.generateToken({ email: email.toLowerCase().trim(), verificationCode }, "15m");

    res.cookie("employeeVerificationToken", token, {
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
    console.error("registerEmployeeController.sendCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

registerEmployeeController.verifyCode = async (req, res) => {
  const { code } = req.body;

  const codeValidation = utils.validateVerificationCode(code);
  if (!codeValidation.valid) {
    return res.status(400).json({ message: codeValidation.message });
  }

  try {
    const token = req.cookies.employeeVerificationToken;
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

    res.clearCookie("employeeVerificationToken");
    res.cookie("employeeRegistrationToken", verifiedToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Email verified. Continue with the registration." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The code has expired. Please request a new one." });
    }
    console.error("registerEmployeeController.verifyCode:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

registerEmployeeController.personalInfo = async (req, res) => {
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
    () => utils.validateName(name, "First name"),
    () => utils.validateName(lastname, "Last name"),
    () => employeeUtils.validateDUI_NIT(DUI_NIT),
    () => utils.validateAddress(address),
    () => utils.validatePhone(phone),
    () => employeeUtils.validateEmployeeType(type),
    () => employeeUtils.validateSalary(salary),
    () => (AFP !== undefined ? utils.validatePositiveNumber(AFP, "AFP") : { valid: true }),
    () => (rent !== undefined ? utils.validatePositiveNumber(rent, "Rent") : { valid: true }),
    () => (additionalPay !== undefined ? utils.validatePositiveNumber(additionalPay, "Additional pay") : { valid: true }),
  ]);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const token = req.cookies.employeeRegistrationToken;
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

    res.clearCookie("employeeRegistrationToken");
    res.cookie("employeeRegistrationToken", infoToken, {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ message: "Information saved. Continue with the password." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please verify your email again." });
    }
    console.error("registerEmployeeController.personalInfo:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

registerEmployeeController.setPassword = async (req, res) => {
  const { password } = req.body;

  const passwordValidation = utils.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const token = req.cookies.employeeRegistrationToken;
    if (!token) {
      return res.status(401).json({ message: "Registration session expired." });
    }

    const decoded = emailUtils.verifyToken(token);
    if (!decoded.emailVerified || !decoded.personalInfo || !decoded.workInfo) {
      return res.status(401).json({ message: "Incomplete registration. Please start over." });
    }

    const { email, personalInfo, workInfo } = decoded;

    const exists = await employeeModel.findOne({ "loginInfo.email": email });
    if (exists) {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newEmployee = new employeeModel({
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

    await newEmployee.save();
    res.clearCookie("employeeRegistrationToken");

    return res.status(201).json({ message: "Employee registered successfully." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please start the registration over." });
    }
    console.error("registerEmployeeController.setPassword:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default registerEmployeeController;