import { model, Model, Schema } from "mongoose";


const tagSchema=new Schema(
    {
        tagName:{
            type:String
        }
    },
    {
        timestamps:true
    }
)

const PackageTagModel=model("PackageTag",tagSchema)

export default PackageTagModel