import { model, Schema } from "mongoose";


const localCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    photo: {
      public_id: {
        type: String,
        default:"",
      },
      secure_url: {
        type: String,
        default:""
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
  },
  {
    timestamps: true,
  }
);


const LocalCategoryModel=model("UCS_Local_Category",localCategorySchema)


export default LocalCategoryModel