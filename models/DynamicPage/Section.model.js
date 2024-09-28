import { model, Schema } from "mongoose";

// Schema for a child structure
const childSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

// Main schema with potential child elements
const SectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    page: {
      type: String, // e.g., 'home', 'about', 'services'
      required: true,
    },
    // Array of child elements (optional)
    children: [childSchema],
  },
  {
    timestamps: true,
  }
);

const SectionModel = model("SectionSchema", SectionSchema);

export default SectionModel;
