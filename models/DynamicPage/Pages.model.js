import { model, Schema } from "mongoose";

// Page schema
const pageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensure unique page names
    },
    sections: [
      {
        type: Schema.Types.ObjectId, // Reference to section IDs
        ref: "SectionSchema", // Reference to the common model
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PageModel = model("Page", pageSchema);

export default PageModel;
