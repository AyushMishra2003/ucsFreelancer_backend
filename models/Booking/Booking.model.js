import mongoose, { model, Schema } from "mongoose";

const BookingSchema = new Schema({
  bookingId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ucs_User',
  },
  cityName:{
    type:String
 },
  tripType: {
    type: String,
    enum: ["Airport Trip", "Round", "One-Way Trip", "Local"],
    required: true,
  },
  fromLocation: {
    type: String,
    // required: true,
  },
  toLocation: {
    type: String,
    // required: true,
  },
  airpotAddress: {
    type: String,
    // required: true,
  },
  pickupAddress: {
    type: String
  },
  dropAddress: {
    type: String
  },
  category: {
    type: String,
    required: true,
  },
  actualPrice: {
    type: Number,
    required: true,
  },
  discountValue: {
    type: Number,
    default: 0, // Amount or percentage of discount applied
  },
  airpotValue:{
    type:Number,
    enum:[1,2]
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  voucherDiscount: {
    type: Number,
  },

  status: {
    type: String,
    enum: ["pending","ongoing", "confirmed", "cancelled", "complete"],
    default: "pending",
  },
  extraKm: {
    type: Number,
    default: 0,
  },
  gst:{
    type:Boolean,
    default:false
  },
  extraPrice: {
    type: Number,
    default: 0,
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  pickupTime: {
    type: String, // Format: HH:MM:SS or use a different format if needed
    required: true,
  },
  driverDetails: [{
    name: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    carNumber: { type: String },
    isActive:{
      type:Boolean,
      default:false
    }
  }],
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  bookingTime: {
    type: String,
    default: function() {
      const now = new Date();
      return now.toTimeString().split(' ')[0]; // Stores time in HH:MM:SS format
    },
  },
}, { timestamps: true });

// Function to generate the bookingId
// BookingSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const now = new Date();
//     const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
//     const latestBooking = await mongoose.model('UcsCab_Booking').findOne({
//       bookingId: { $regex: `^UCS${datePrefix}` }
//     }).sort({ bookingId: -1 });

//     let lastIdNumber = 100;
//     if (latestBooking) {
//       const lastId = latestBooking.bookingId.slice(-3); // Extract last 3 digits
//       lastIdNumber = parseInt(lastId, 10) + 1;
//     }
//     this.bookingId = `UCS${datePrefix}${lastIdNumber.toString().padStart(3, '0')}`;
//   }
//   next();
// });

const Booking = model('UcsCab_Booking', BookingSchema);

export default Booking;
