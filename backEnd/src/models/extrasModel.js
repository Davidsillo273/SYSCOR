import {Schema, model} from 'mongoose';

const extraSchema = new Schema({
    name : {
        type : String
    },
    price: {
        type : Number
    },
    status: {
        type : Boolean
    }
},{
    timestamps : true,
    strict: false
})
export default model("Extras", extraSchema)