import { model, Schema, Types } from "mongoose";

const rateSchema = new Schema(
  {
    fromCity: {
      type: String,
      required: true,
    },
    toCity: {
      type: String,
      required: true,
    },
    rates: [
      {
        category: {
          type: Types.ObjectId,
          ref: "UCS_OneWay_Category",
          // required: true,
        },
        rate: {
          type: Number,
          required: true,
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

// Create a unique index on fromCity and toCity to enforce one document per route
rateSchema.index({ fromCity: 1, toCity: 1 }, { unique: true });

const CityRate = model("USC_CityRate", rateSchema);

export default CityRate;
