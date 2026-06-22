import mongoose, { Schema, model } from "mongoose";

const cartSchema = new Schema({
    idCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    details: [
        {
            combos: [
                {
                    comboId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Combos"
                    },
                    quantity: { type: Number, default: 1 }
                }
            ],
            extras: [
                {
                    extraId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Extras"
                    },
                    drinks: [
                        {
                            drinkId: {
                                type: mongoose.Schema.Types.ObjectId,
                                ref: "Drinks"
                            }
                        }
                    ],
                    quantity: { type: Number, default: 1 }
                }
            ],
            subTotal: { type: Number, required: true }
        }
    ],
    total: {
        type: Number,
        default: 0
    },
    status: {
        type: String
    }
}, {
    timestamps: true,
    strict: true
});

export default model("Cart", cartSchema);