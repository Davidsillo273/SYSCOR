import mongoose, { Schema, model } from "mongoose";

const employeeSchema = new Schema(
  {
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      DUI_NIT: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      image: { type: String, default: null },
      type: {
        type: String,
        required: true,
        enum: ["kitchen", "waiter", "cashier", "manager", "cleaner", "other"],
      },
    },
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      isVerified: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      timeOut: { type: Date, default: null },
    },
    workInfo: {
      workInsurance: { type: Boolean, default: false },
      AFP: { type: Number, default: 0 },
      rent: { type: Number, default: 0 },
      salary: { type: Number, required: true },
      additionalPay: { type: Number, default: 0 },
      isAuthorized: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "on_leave"],
        default: "active",
      },
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

export default model("Employee", employeeSchema);