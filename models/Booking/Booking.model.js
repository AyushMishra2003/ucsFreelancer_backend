import mongoose, { model, Schema } from "mongoose";

const BookingSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ucs_User',
  },
  tripType: {
    type: String,
    enum: ["Airport Trip", "Round Trip", "One-Way Trip", "Local Trip"],
    required: true,
  },
  fromLocation: {
    type: String,
    required: true,
  },
  toLocation: {
    type: String,
    required: true,
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
  totalPrice: {
    type: Number,
    required: true,
  },
  vocherDiscount:{
    type:Number,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "complete"],
    default: "pending",
  },
  isCancel: {
    type: Boolean,
    default: false,
  },
  extraKm:{
    type:Number,
    default:0
  },
  extraPrice:{
   type:Number,
   default:0
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  driverDetails: {
    name: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    carNumber: { type: String },
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  bookingTime: {
    type: String,
    default: function() {
      const now = new Date();
      return now.toTimeString().split(' ')[0]; // Stores time in HH:MM:SS format
    }
  }
}, { timestamps: true });

const Booking = model('UcsCab_Booking', BookingSchema);

export default Booking;
