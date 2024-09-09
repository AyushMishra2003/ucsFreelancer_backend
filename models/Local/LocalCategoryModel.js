import { model, Schema } from "mongoose";


const localCategorySchema=new Schema(
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

const LocalCategoryModel=model("UCS_Local_Category",localCategorySchema)


export default LocalCategoryModel