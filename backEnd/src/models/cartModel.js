import mongoose , {Schema, model } from "mongoose";

const cartSchema = new Schema({
    idCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required:true
    },
    details:[
        {combos:[
            {
                comboId: {
                    type: moongose.Schema.Types.ObjectId,
                    ref: "Combos"
                },
                quantity:{type:Number, default:1}
            }
        ],
        extras: [
            {
                drinks:[
                    {
                        drinkId:{
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "Drinks"
                        }
                    }
                ],
                quantity:{type:Number, default:1}
            }
        ],
        subTotal:{type:Number , required:true}
    }
    ],
    total:{type:Number},
    status:{type:String}
},{
    timestamps:true,
    strict:true
});

export default model("Cart",cartSchema);