import { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const adminScheama=new Schema(
    {
       email:{
          type:String,
          required:true
       },
       password:{
         type:String,
         required:true
       },
       name:{
        type:String
       },
       profile:{
        public_id: {
            type: String,
          },
          secure_url: {
            type: String,
          },
      },
      status:{
        type:Boolean,
        default:true
      },
      role:{
        type:String,
        enum:["Admin","Operator"],
        default:"Operator"
      }
    },
    {
        timestamps:true
    }
)


  
  adminScheama.methods = {
    generateJWTToken: async function () {
      return await jwt.sign(
        { id: this._id, name: this.name },
          process.env.SECRET,
        {
          expiresIn: "24h",
        }
      );
    },
    comparePassword: async function (plaintextPassword) {
      return await bcrypt.compare(plaintextPassword, this.password);
    },
  };
  


const Admin=model("UcsCab_Admin",adminScheama)


export default Admin