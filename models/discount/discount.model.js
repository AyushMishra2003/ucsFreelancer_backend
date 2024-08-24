import { model, Schema } from "mongoose";

// Define the discount schema
const discountSchema = new Schema({
  tripType: {
    type: String,
    enum: ["Airport Trip", "Round Trip", "One-Way Trip", "Local Trip"],
    required: true,
  },
  discountType: {
    type: Number,
    enum: [1, 2], // 1 for percentage, 2 for fixed amount
    required: true,
  },
  discountValue: {
    type: Number,
    required: true, // This will be a percentage or fixed amount depending on discountType
  },
  discountApplication: {
    type: Number,
    enum: [1, 2], // 1 for next trip, 2 for current trip
    required: true,
  },
  active: {
    type: Boolean,
    default: true, // Defaults to active
  },
  expiryDate: {
    type: Date,
    // Optional field for expiry date
  },
});

// Create and export the Discount model
const Discount = model("USC_Discount", discountSchema);

export default Discount;
