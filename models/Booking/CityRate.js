import { model, Schema } from "mongoose";

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
          type: String,
          enum: ["Indigo", "Datsun", "Dxire", "Innova", "Premium_Sedan", "Ertiga", "InnovaCrysta","Swift","Brezza"],
          required: true,
        },
        rate: {
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

// Create a unique index on fromCity and toCity to enforce one document per route
rateSchema.index({ fromCity: 1, toCity: 1 }, { unique: true });

const CityRate = model("USC_CityRate", rateSchema);

export default CityRate;
