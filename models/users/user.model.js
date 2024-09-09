import mongoose from 'mongoose';
import Booking from '../Booking/Booking.model.js';
import jwt from 'jsonwebtoken'; // Import the jsonwebtoken package

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


userSchema.methods = {
  generateJWTToken: async function () {
    return await jwt.sign(
      { id: this._id, userName: this.userName },
      process.env.SECRET,
      {
        expiresIn: "24h",
      }
    );
  },
  comparePassword: async function (plaintextPassword) {
    return await bcrypt.compare(plaintextPassword, this.password);
  },
};


const User = mongoose.model('Ucs_User', userSchema);
export default User;
