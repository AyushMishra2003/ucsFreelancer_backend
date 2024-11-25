import { model, Schema } from "mongoose";



const PackageIncludeSchema=new Schema(
    {
         includeName:{
            type:String,
            require:true,
            unique:true
         },
    },
    {
        timestamps:true
    }
)


const PackageIncludeModel=model("PackageInclude",PackageIncludeSchema)

export default PackageIncludeModel