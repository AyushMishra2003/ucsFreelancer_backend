import { model, Schema } from "mongoose";

const VendorSchema = new Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    city: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const VendorModel = model("UCS_VENDOR", VendorSchema);

export default VendorModel;
