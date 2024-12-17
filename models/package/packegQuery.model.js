import { model, Schema } from "mongoose";

const packageQuerySchema = new Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true, // Removes extra spaces
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true
    },
    adults: {
        type: String,
        required: true
    },
    children: {
      type: String,
      required: true
    },
    infants: {
        type: String,
        required: true
    },
    query: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Creating the model
const PackageQuery = model("PackageQuery", packageQuerySchema);

export default PackageQuery;
