import { model, Schema } from "mongoose";


const paymentSchema=new Schema(
    {
        mode1:{
            type:Number,
            requrired:true
        },
        mode2:{
            type:Number,
            required:true
        }
    },
    {
        timestamps:true
    }
)


const PaymentModel=model("UCS_PAYEMENT_MODEL",paymentSchema)


export default PaymentModel

