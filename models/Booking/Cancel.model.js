import mongoose, { model, Schema } from "mongoose";



const cancelBooking=new Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "'UcsCab_Booking",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UcsCab_Users',
            required: true,
        },
        by:{
           type:String
        },
        reason:{
            type:String
        }   
    },
    {
       timestamps:true
    }
)


const CancelBooking=model("UcsCab_Canecel_Booking",cancelBooking)


export default CancelBooking