import mongoose, { Schema, model } from "mongoose";

const cardSchema = new Schema(
  {
    token: { type: String, required: true },
    lastFour: { type: String, required: true, maxlength: 4 },
    brand: { type: String, required: true, enum: ["VISA", "MASTERCARD", "AMEX", "DINERS", "OTHER"] },
    cardHolder: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    _id: false,
  },
);

const addressSchema = new Schema(
  {
    tag: { type: String, required: true },
    details: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    _id: false,
  },
);

const customerSchema = new Schema(
  {
    personalInfo: {
      name: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      image: { type: String, default: null },
      birthdate: { type: Date, default: null },
      addresses: { type: [addressSchema], default: [] },
      phones: { type: [String], default: [] },
      cards: { type: [cardSchema], default: [] },
    },
    loginInfo: {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      isVerified: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      timeOut: { type: Date, default: null },
    },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

export default model("Customer", customerSchema);