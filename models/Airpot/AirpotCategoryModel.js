import { model, Schema } from "mongoose";


const airpotCategorySchema=new Schema(
    {
          name:{
            type:String,
            required:true,
            unique:true
          },
          description:{
            type:String
          }
    },
    {
        timestamps:true
    }
)

const airpotCategory=model("UCS_Airpot_Category",airpotCategorySchema)


export default airpotCategory