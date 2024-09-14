import { model, Schema } from "mongoose";


const roundCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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
    perKm:{
      type:Number
    },
    extraKm:{
      type:Number
    }
  },
  {
    timestamps: true,
  }
);


const roundCategoryModel=model("UCS_Round_Category",roundCategorySchema)


export default roundCategoryModel