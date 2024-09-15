import { model, Schema } from "mongoose";


const oneWayCategorySchema = new Schema(
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
    }
  },
  {
    timestamps: true,
  }
);


const oneWayCategoryModel=model("UCS_OneWay_Category",oneWayCategorySchema)


export default oneWayCategoryModel