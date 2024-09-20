import { model, Schema, Types } from "mongoose";

const AirpotRateSchema = new Schema(
  {
    cityName: {
      type: String,
      required: true,
      unique: true,
    },
    rates: [
      {
        category: {
          type: Types.ObjectId,
          ref: "UCS_Airpot_Category",
          // required: true,
        },
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

// Create a unique index on cityName to enforce one document per city
AirpotRateSchema.index({ cityName: 1 }, { unique: true });

const AirpotCityRate = model("AirpotCityRate",AirpotRateSchema);

export default AirpotCityRate;
