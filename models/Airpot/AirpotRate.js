import { model, Schema, Types } from "mongoose";

const airpotCityRateSchema = new Schema(
  {
    airpotCategory: {
      type: String,
      required: true,
      unique: true,
    },
    rates: [
      {
        kilometer: {
          type: String,
          enum:["30","45","50","70"]
          // required: true,
        },
        rate:{
            type:Number
        },
        extra:{
           type:Number 
        }   
      },
    ],
  },
  {
    timestamps: true,
  }
);


const AirpotRateModel = model("AirpotRate",airpotCityRateSchema);

export default AirpotRateModel;
