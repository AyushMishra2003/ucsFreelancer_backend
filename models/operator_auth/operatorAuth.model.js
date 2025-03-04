import { model, Schema } from "mongoose";


const operatorAuthSchema = new Schema(
    {
         name:{
            type:String,
            required:true
         },
         email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true   
        },
        status:{
            type:String,
            default:"active",
            enum:["active","inactive"]
        },
        loginAt:{
            type: Date
        },
        token:{
            type:String
        },
        role:[
            {
                type:Schema.Types.ObjectId,
                ref:"RoleUCS"
            }
        ],
        isAdmin:{
            type:Boolean,
            default:false,
            enum:[true,false]
        }

    },
    {
        timestamps: true
    }
)


const OperatorAuthModel = model("OperatorAuthUCS", operatorAuthSchema)

export default OperatorAuthModel