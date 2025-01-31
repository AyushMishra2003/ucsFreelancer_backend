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
        },
        kilometer: {
          type: String,
          enum: ["40", "45", "55", "70"],
        },
        rate: {
          type: Number,
          required: true,
        },
        extra: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a unique index on cityName to enforce one document per city
AirpotRateSchema.index({ cityName: 1 }, { unique: true });

const AirpotCityRate = model("AirpotCityRate", AirpotRateSchema);

export default AirpotCityRate;
