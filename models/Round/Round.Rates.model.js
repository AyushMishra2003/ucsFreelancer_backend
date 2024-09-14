import { model, Schema, Types } from "mongoose";

const RoundRateSchema = new Schema(
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
          ref: "UCS_Round_Category",
          // required: true,
        },
        perKm: {
          type: Number,
          // required: true,
        },
        extraKm:{
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
RoundRateSchema.index({ cityName: 1 }, { unique: true });

const RoundCityRate = model("RoundCityRate", RoundRateSchema);

export default RoundCityRate;
