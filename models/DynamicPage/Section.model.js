import { model, Schema } from "mongoose";
import { type } from "os";

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
  meta_description: {
    type: String,
    default: "",
  },
  
  meta_url:{
    type:String,
    default:""
  },

  meta_title:{
    type:String, 
    default:""
  }
  

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
    page: {
      type: String, // e.g., 'home', 'about', 'services'
      required: true,
    },

    meta_description: {
      type: String,
      default: "",
    },
    
    meta_url:{
      type:String,
      default:""
    },
  
    meta_title:{
      type:String, 
      default:""
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
