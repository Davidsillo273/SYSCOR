import mongoose, { Schema, model } from "mongoose";

const adminSchema = new Schema(
  {
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      image: { type: String, default: null },
    },
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      isVerified: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      timeOut: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

export default model("Admin", adminSchema);