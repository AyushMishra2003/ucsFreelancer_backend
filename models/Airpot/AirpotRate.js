import { model, Schema, Types } from "mongoose";

const airpotCityRateSchema = new Schema(
  {
    category: {
      type: Types.ObjectId,
      ref: "UCS_Airpot_Category",
      // required: true,
    },
    rates: [
      {
        kilometer: {
          type: String,
          enum:["40","45","55","70"]
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
