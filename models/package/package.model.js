import { model, Schema } from "mongoose";

const PackageSchema = new Schema(
  {
    packageName:{type:String},
    dateFrom: { type: Date, required: true }, // Start date of the package
    dateTo: { type: Date, required: true }, // End date of the package
    duration: { type: String, required: true }, // Duration, e.g., "5 Days, 4 Nights"
    rate: { type: Number, required: true }, // Total package rate
    locationRate: { type: Number }, // Location-specific rate
    mainPhoto: {
      public_id: { type: String, default: "" }, // Public ID of the main photo
      secure_url: { type: String, default: "" }, // URL of the main photo
    }, 
    photos: [
      {
        public_id: { type: String, default: "" }, // Public ID of the photo
        secure_url: { type: String, default: "" }, // URL of the photo
      },
    ], // Array of photos
    inclusive: { type: String, default: "" }, // Single string for inclusions
    exclusive: { type: String, default: "" }, // Single string for exclusions
    bookingPolicy: { type: String, default: "" }, // Booking policy text
    termsAndCondition: { type: String, default: "" }, // Terms and conditions text
    dayWise: [
      {
        day: { type: String }, // Day name or identifier
        description: { type: String }, // Description for that day
      },
    ], // Array of day-wise descriptions
    includedDetails: {
      type: [String], // Array of strings to store options like 'hotelIncluded', 'mealIncluded', 'dummyOption'
      default: [], // Default empty array
    },
    categoriesDetails:{
       type:[String],
       default:[]
    },
    packageTagDetail:{
      type:[String],
      default:[]
    },
    
    location:{
      type:String
    },
    category:{
      type:String
    },
    rateBy:{
      type:String
    },
    destinationType:{
      type:String,
      default:"none"
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);


const  PackageModel=model("PackageModel",PackageSchema)

export default PackageModel;
