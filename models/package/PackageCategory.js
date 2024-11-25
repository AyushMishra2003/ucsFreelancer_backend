import { model, Schema } from "mongoose";


const PackageCategorySchema=new Schema(
    {
        categoryName:{
            type:String,
            require:true,
            unique:true
        },
        categoryPhoto:{
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


const PackageCategoryModel=model("PackagesCategory",PackageCategorySchema)

export default PackageCategoryModel