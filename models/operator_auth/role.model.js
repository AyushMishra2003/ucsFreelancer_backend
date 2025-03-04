import { model, Schema } from "mongoose";


const roleScheam=new Schema(
    {
          title:{
            type:String,
            unique:true
          }
    },
    {
        timestamps:true
    }
)


const RoleModel=model("RoleUCS",roleScheam)

export default RoleModel