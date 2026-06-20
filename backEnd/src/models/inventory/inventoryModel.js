import {Schema, model} from "mongoose"

const inventorySchema = new Schema({
    name: {
        type: String
    },
    price:{
        type: Number
    },
    ubication:{
        type: String
    },
    quantity:{
        type: Number
    },
    type: {
        type: String
    },
    status: {
        type: String
    }
}, 
{
    timestamps: true,
    strict: false
})

export default model("Inventory", inventorySchema)