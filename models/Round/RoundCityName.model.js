import { model, Schema } from "mongoose";


const roundCitySchema=new Schema(
    {
         roundCityName:{
            type:String,
            required:true,
            unique:true
         }
    },
    {
        timestamps:true
    }
)


const roundCityModel=model("UCS_ROUND_CITY_NAME",roundCitySchema)


export default roundCityModel