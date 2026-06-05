import mongoose, {Schema, model} from "mongoose"

const CombosSchema = new Schema({
    image: {
        type: String
    },
    name: {
        type: String
    },
    saucersId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Saucers"
    },
    drinksId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Drinks"
    },
    price:{
        type: Number
    },
    quantity:{
        type: Number
    },
    description:{
        type: String
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

export default model("Combos", CombosSchema)