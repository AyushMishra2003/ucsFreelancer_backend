import { model, Schema, Types } from "mongoose";

const localCityRateSchema = new Schema(
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
          ref: "UCS_Local_Category",
          // required: true,
        },
        perKm: {
          type: Number,
          // required: true,
        },
        perHour: {
          type: Number,
          required: true,
        },
        rateFor80Km8Hours: {
          type: Number,
          // required: true,
        },
        rateFor120Km12Hours: {
          type: Number,
          // required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a unique index on cityName to enforce one document per city
localCityRateSchema.index({ cityName: 1 }, { unique: true });

const LocalCityRate = model("LocalCityRate", localCityRateSchema);

export default LocalCityRate;
