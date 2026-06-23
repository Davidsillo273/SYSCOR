import { Schema, model } from 'mongoose';

const tableSchema = new Schema({
    number: {
        type: Number
    },
    status: {
        type: String
    }
}, {
    timestamps: true,
    strict: false
});

export default model("Tables", tableSchema);