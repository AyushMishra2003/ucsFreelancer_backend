import { model, Schema } from "mongoose";



const PackageIncludeSchema=new Schema(
    {
         includeName:{
            type:String,
            require:true,
            unique:true
         },
         includePhoto:{
            public_id: {
                type: String,
                default:"",
              },
              secure_url: {
                type: String,
                default:""
              },
        }
    },
    {
        timestamps:true
    }
)


const PackageIncludeModel=model("PackageInclude",PackageIncludeSchema)

export default PackageIncludeModel