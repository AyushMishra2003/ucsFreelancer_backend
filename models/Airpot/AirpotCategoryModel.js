import { model, Schema } from "mongoose";

const airpotCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    photo: {
      public_id: {
        type: String,
        default: "",
      },
      secure_url: {
        type: String,
        default: "",
      },
    },
    numberOfSeats: {
      type: Number,
      required: true,
    },
    acAvailable: {
      type: Boolean,
      default: false,
    },
    numberOfBags: {
      type: Number,
      required: true,
    },
    rates:[
      {
        kilometer:{
          type:String,
          enum:["30","40","55","70"]
        },
        rate:{
          type:Number
        },
        extra:{
          type:Number
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const airpotCategory = model("UCS_Airpot_Category", airpotCategorySchema);

export default airpotCategory;
