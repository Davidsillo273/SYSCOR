import {Schema, model} from "mongoose"

const drinkSchema = new Schema({
    image: {
        type: String
    },
    name: {
        type: String
    },
    price:{
        type: Number
    },
    quantity:{
        type: Number
    },
    status: {
        type: String,
    },
    public_id: {
        type: String}
}, 
{
    timestamps: true,
    strict: false
})

export default model("Drinks", drinkSchema)