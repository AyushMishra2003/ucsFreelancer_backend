import mongoose, { model, Schema } from "mongoose";

const LocalTermCondition = new Schema(
  {
    data: [
      {
        tripType: {
          type: String,
          required: true,
          enum: ["local", "airpot", "oneway", "round"],
        },
        tC: [
          {
            _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Unique ObjectId for each tc
            type: {
              type: String, // Term or condition text
              required: true
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const LocalTerm = model("UCS_TC", LocalTermCondition);

export default LocalTerm;
