import mongoose from 'mongoose';
import Booking from '../Booking/Booking.model.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type:  String,
    required: true,
  },
  isVerify: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  profile: {
    public_id: {
      type: String,
    },
    secure_url: {
      type: String,
    },
  },
  bookingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking', // Reference to the Booking model
  }],
  discount: {
    tripType: {
      type: String,
      // required: true,
    },
    rate: {
      type: Number,
      // required: true,
    },
    lastDate: {
      type: Date,
      // required: true,
    },
  },
});


const User = mongoose.model('Ucs_User', userSchema);
export default User;
