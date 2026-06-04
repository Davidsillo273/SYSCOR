import {Schema, model} from "mongoose"

const saucersSchema = new Schema({
    image: {
        type: String
    },
    name: {
        type: String
    },
    category: {
        type: String
    },
    price:{
        type: Number
    },
    status: {
        type: Boolean,
    },
    public_id: {
        type: String}
}, 
{
    timestamps: true,
    strict: false
})

export default model("Saucers", saucersSchema)