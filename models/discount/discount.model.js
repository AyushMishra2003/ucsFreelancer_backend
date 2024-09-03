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
  expiryTime: {
    type: String,
    // Optional field for expiry time (e.g., "23:59" for 11:59 PM)
  },
  voucherCode: {
    type: String,
    unique: true,
  },
  discountLimit:{
    type:Number,
  }
});

// Pre-save hook to generate a unique voucher code
discountSchema.pre("save", async function (next) {
  const discount = this;

  if (!discount.voucherCode) {
    // Find the highest existing voucher code
    const lastDiscount = await Discount.findOne()
      .sort({ voucherCode: -1 })
      .exec();

    let newCodeNumber = 100; // Starting number

    if (lastDiscount && lastDiscount.voucherCode) {
      // Extract the number from the last voucher code
      const lastNumber = parseInt(
        lastDiscount.voucherCode.replace("UCSDIS", ""),
        10
      );
      newCodeNumber = lastNumber + 1;
    }

    // Generate the new voucher code
    discount.voucherCode = `UCSDIS${newCodeNumber}`;
  }

  next();
});

// Create and export the Discount model
const Discount = model("USC_Discount", discountSchema);

export default Discount;
