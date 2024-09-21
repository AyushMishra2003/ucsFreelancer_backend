import Booking from '../../models/Booking/Booking.model.js';
import User from '../../models/users/user.model.js';
import CityRate from '../../models/Booking/CityRate.js';
import Discount from '../../models/discount/discount.model.js';
import sendEmail from '../../utilis/sendEmail.js';
import AppError from '../../utilis/error.utlis.js';
import Admin from '../../models/admin/admin.model.js'
import moment from 'moment';
import LocalCityRate from '../../models/Local/LocalCityRateModel.js';
import LocalCategoryModel from '../../models/Local/LocalCategoryModel.js';
import axios from 'axios';
import AirpotRateModel from '../../models/Airpot/AirpotRate.js';
import roundCategoryModel from '../../models/Round/Round.category.model.js';
import airpotCategory from '../../models/Airpot/AirpotCategoryModel.js';
import oneWayCategoryModel from '../../models/oneway/Category.model.js';


const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString(); // Generates a 5-digit OTP
};

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
  return new Date(now.getTime() - offset); // Convert to local time
};

const validateTime = (expiryDate, expiryTime) => {
  // Check if expiryTime is defined
  if (!expiryTime) {
    return { valid: false, message: "Expiry time is required." };
  }

  const timePattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = expiryTime.match(timePattern);

  if (!match) {
    return { valid: false, message: "Invalid expiry time format. Use 12-hour format like '2:00 AM'." };
  }

  let [hours, minutes, period] = match.slice(1);
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return { valid: false, message: "Invalid expiry time values. Hours must be between 1 and 12, and minutes between 0 and 59." };
  }

  // Convert 12-hour format to 24-hour format
  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  // Construct the expiry date and time
  let expiry = new Date(`${expiryDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  console.log("Constructed Expiry Date:", expiry);

  if (isNaN(expiry.getTime())) {
    return { valid: false, message: "Invalid expiry date or time." };
  }

  // Get the current date and time
  const now = new Date();

  // Check if expiry is in the future
  if (expiry <= now) {
    return { valid: false, message: "The expiry date and time must be in the future." };
  }

  return { valid: true };
};



const generateBookingId = async (bookingDate) => {
  const d1=new Date()

  console.log(d1);
  
  const date = getLocalDate()
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const dateStr = `${year}${month}${day}`;
  const prefix = 'UCS';


  console.log(date,year,month,day);
  

  // Find the latest booking ID for the provided booking date
  const latestBooking = await Booking.findOne({
    bookingId: { $regex: `^${prefix}${dateStr}` } // Match IDs for the specified date
  }).sort({ bookingId: -1 }); // Get the latest one

  let seqNum = 1;
  if (latestBooking) {
    const lastSeq = parseInt(latestBooking.bookingId.substring(prefix.length + dateStr.length), 10);
    seqNum = lastSeq + 1;
  }

  const seqStr = String(seqNum).padStart(3, '0'); // Ensure it’s 3 digits

  return `${prefix}${dateStr}${seqStr}`;
};


const addOneWayBooking = async (req, res, next) => {
  try {
    let {
      fromLocation, toLocation, extraPerKm,tripType, category, bookingDate, bookingTime,gst, pickupDate, pickupTime, name, email, phoneNumber, voucherCode, pickupAddress, dropAddress
    } = req.body;


    console.log("req.body",req.body);
    


    const now = new Date();
    if (!bookingDate) {
      bookingDate = getLocalDate() // YYYY-MM-DD format
    }
    if (!bookingTime) {
      bookingTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // 12-hour format (e.g., 2:30 PM)
    }
    
    // Validate required fields

    console.log(fromLocation,toLocation,tripType,category,bookingDate,bookingTime,pickupDate,pickupTime,email,pickupAddress,dropAddress);

    if (!fromLocation || !toLocation || !tripType || !category || !bookingDate || !bookingTime || !pickupDate || !pickupTime || !email || !pickupAddress || !dropAddress ) {
      console.log("kya mai chala kya bhai");
      return next(new AppError("All required fields must be provided", 400));
    }

    const bookingId = await generateBookingId(bookingDate);

    // const { valid, message } = validateTime(bookingDate, bookingTime);
    // if (!valid) {
    //   return next(new AppError(message, 400));
    // }

    // Validate pickup time
    const pickupTimeValidation = validateTime(pickupDate, pickupTime);
    if (!pickupTimeValidation.valid) {
      return next(new AppError(pickupTimeValidation.message, 400));
    }



    // Fetch city rate if it's a One-Way Trip
    let actualPrice = 0;
    if (tripType === 'One-Way Trip') {
      const cityRate = await CityRate.findOne({ fromCity: fromLocation, toCity: toLocation });
      if (!cityRate) {
        return next(new AppError("Rate information not found for the specified route", 400));
      }

      console.log(cityRate);



      const onewayCategory = await oneWayCategoryModel.findOne({ name: category });
      
      
      const rateObj = cityRate.rates.find(rate => rate.category.toString() === onewayCategory._id.toString());
      console.log(rateObj);
      
      if (!rateObj) {
        return next(new AppError("Rate category not found for the specified route", 400));
      }
      actualPrice = rateObj.rate;
    }

    // Initialize discount
    let discountValue = 0;

    // Handle voucher code if provided
    let discountInfo
    if (voucherCode) {
       discountInfo = await Discount.findOne({
        voucherCode: voucherCode, // Assuming the discount document has a 'code' field
        active: true,
        $or: [
          { expiryDate: { $exists: false } }, // No expiry date means always valid
          { expiryDate: { $gte: new Date() } } // Check if expiry date is not in the past
        ]
      });

      if (discountInfo) {
        const discountExpiryDate = moment(discountInfo.expiryDate).endOf('day');
        const discountExpiryTime = moment(discountInfo.expiryTime, 'h:mm A');

        // Check if the current date and time are within the discount's expiry date and time
        if (discountExpiryDate.isBefore(new Date()) || 
            (discountExpiryDate.isSame(new Date(), 'day') && discountExpiryTime.isBefore(moment()))) {
          return next(new AppError("Discount has expired", 400));
        }

        // Check if actual price meets the discount limit
        if (actualPrice >= discountInfo.discountLimit) {
          // Apply discount based on its type
          if (discountInfo.discountType === 1) {
            // Percentage discount
            discountValue = (actualPrice * discountInfo.discountValue) / 100;
          } else if (discountInfo.discountType === 2) {
            // Fixed discount
            discountValue = discountInfo.discountValue;
          }
        } else {
          return next(new AppError("Price does not meet the discount limit", 400));
        }
      }
    }

    if(gst){
      const gstValue=actualPrice*5/100;
      actualPrice=actualPrice+gstValue
    }

    // Calculate the total price after discount
    const totalPrice = actualPrice - discountValue;

    // Create the booking
    const booking = new Booking({
      bookingId,
      fromLocation,
      toLocation,
      tripType,
      category,
      actualPrice,
      discountValue,
      totalPrice,
      bookingDate,
      bookingTime,
      pickupDate,
      pickupTime,
      pickupAddress,
      dropAddress,
      extraPerKm,
      status: "confirmed" // Set status to confirmed
    });

    // Save booking first
    await booking.save();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      let userDiscount;
      // If user exists, apply discount to the user's discount info
      if (user.discount && user.discount.tripType === tripType && user.discount.lastDate >= new Date()) {
        userDiscount = user.discount;
        if (userDiscount) {
          booking.voucherDiscount = userDiscount.rate;
          booking.totalPrice = booking.totalPrice - userDiscount.rate;
        }
        user.discount = {};
        await user.save();
      }
      if (discountInfo && discountInfo.discountApplication === 1) {
        // Apply discount to user's future trips
        user.tripType = tripType;
        user.discount = {
          tripType,
          rate: discountInfo.discountValue,
          lastDate: discountInfo.expiryDate
        };
        await user.save();
      }

      // Update booking with userId
      booking.userId = user._id;
      await booking.save();

      // Update user's booking history
      user.bookingHistory.push(booking._id);
      await user.save();

      // Send booking confirmation email to existing user
      const bookingSubject = `Booking Confirmation ${bookingId} `;
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
             
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(user.email, bookingSubject, bookingMessage);

      // If user exists but is not verified, send OTP email as well
      if (!user.isVerify) {
        const otp = generateOTP();
        const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        const otpSubject = '🔒 Verify Your Account';
        const otpMessage = `
          <p>Hello ${user.name},</p>
          <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
          <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        `;
        await sendEmail(user.email, otpSubject, otpMessage);
      }

      return res.status(200).json({
        success: true,
        message: "Booking created and confirmed successfully.",
        data: booking
      });
    } else {
      // Create a new user
      if (!name || !phoneNumber) {
        return next(new AppError("Name and phone number are required for new users", 400));
      }

      user = new User({
        name,
        email,
        phoneNumber,
        password:phoneNumber,
        bookingHistory: [booking._id]
      });

      if (discountInfo && discountInfo.discountApplication === 1) {
        // Apply discount to user's future trips
        user.tripType = tripType;
        user.discount = {
          tripType,
          rate: discountInfo.discountValue,
          lastDate: discountInfo.expiryDate
        };
      }

      // Save new user
      await user.save();

      // Update booking with userId
      booking.userId = user._id;
      await booking.save();

      // Send booking confirmation email to new user
      const bookingSubject = `Booking Confirmation ${bookingId} `;
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
             
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(email, bookingSubject, bookingMessage);

      // Send OTP for email verification
      const otp = generateOTP();
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const otpSubject = '🔒 Verify Your Account';
      const otpMessage = `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
        <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      `;
      await sendEmail(email, otpSubject, otpMessage);

      return res.status(200).json({
        success: true,
        message: "Booking created and confirmation email sent successfully.",
        data: booking
      });
    }
  } catch (error) {
    console.error(error);
    return next(new AppError("Something went wrong while creating the booking", 500));
  }
};


const addLocalTripBooking = async (req, res, next) => {
  try {
    let {
      cityName, tripType, extraPerKm,extraPerHr,category,gst, bookingDate, bookingTime, pickupDate, pickupTime, name, email, phoneNumber, voucherCode, pickupAddress, dropAddress, distance, duration, paymentMode
    } = req.body;

    // console.log("req.body", req.body);

    const now = new Date();
    if (!bookingDate) {
      bookingDate = getLocalDate(); // YYYY-MM-DD format
    }
    if (!bookingTime) {
      bookingTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // 12-hour format (e.g., 2:30 PM)
    }

    // Validate required fields
    // console.log(cityName, tripType, category, bookingDate, bookingTime, pickupDate, pickupTime, email, pickupAddress, dropAddress, distance, duration, paymentMode);

    if (!cityName || !tripType || !category || !pickupDate || !pickupTime || !email || !pickupAddress || !dropAddress || !paymentMode) {
      console.log("Missing required fields");
      return next(new AppError("All required fields must be provided", 400));
    }

    const bookingId = await generateBookingId(bookingDate);

    // Validate pickup time
    const pickupTimeValidation = validateTime(pickupDate, pickupTime);
    if (!pickupTimeValidation.valid) {
      return next(new AppError(pickupTimeValidation.message, 400));
    }

    // Fetch city rate if it's a Local Trip
    let actualPrice = 0;
    if (tripType === 'Local') {
      const localCityRate = await LocalCityRate.findOne({ cityName });
      if (!localCityRate) {
        return next(new AppError("Rate information not found for the specified city", 400));
      }


      // console.log(localCityRate);
      

      const categoryDoc = await LocalCategoryModel.findOne({ name: category });

      if (!categoryDoc) {
          return next(new AppError("Category not found", 400));
      }

      const categoryId = categoryDoc._id;

      // Find the city rate object based on cityName
      const cityRate = await LocalCityRate.findOne({ cityName });

      if (!cityRate) {
          return next(new AppError("No rate found for the given city", 404));
      }

      // Find the specific rate by category in the rates array
      const rateIndex = cityRate.rates.find(
          (rateObj) => rateObj.category.toString() === categoryId.toString()
      );

      if (rateIndex === -1) {
          return next(new AppError("No category found for the given city", 404));
      }

      console.log("rate index is",rateIndex);
      

      // Determine rate based on distance and duration
      if (distance === 80) {
        console.log(("kya re pagal"));
        console.log(rateIndex);
        
        
        actualPrice = rateIndex.rateFor80Km8Hours;
      } else if (distance === 120) {
        actualPrice = rateIndex.rateFor120Km12Hours;
      } else {
        // Handle rates for distances beyond 100 km if needed
        return next(new AppError("Distance exceeds available rate limits", 400));
      }

      // If duration exceeds 8 hours, adjust the rate
      // if (duration > 8) {
      //   const extraHours = duration - 8;
      //   actualPrice += extraHours * rateForCategory.perHour;
      // }
    }

    // Initialize discount
    let discountValue = 0;

    // Handle voucher code if provided
    let discountInfo;
    if (voucherCode) {
      console.log(voucherCode);
      
      discountInfo = await Discount.findOne({
        voucherCode: voucherCode,
        active: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: new Date() } }
        ]
      });

      // console.log("dixout info",discountInfo);
      // console.log("mera log ",discountInfo , discountInfo.tripType);
      

      if (discountInfo && discountInfo.tripType===tripType) {
        const discountExpiryDate = moment(discountInfo.expiryDate).endOf('day');
        const discountExpiryTime = moment(discountInfo.expiryTime, 'h:mm A');

        if (discountExpiryDate.isBefore(new Date()) ||
          (discountExpiryDate.isSame(new Date(), 'day') && discountExpiryTime.isBefore(moment()))) {
            
        }

        console.log(discountInfo);
        

        if (actualPrice >= discountInfo.discountLimit) {
          if (discountInfo.discountType === 1) {
            discountValue = (actualPrice * discountInfo.discountValue) / 100;
          } else if (discountInfo.discountType === 2) {
            discountValue = discountInfo.discountValue;
          }
        } 
      }
    }

    if(gst){
      const gstValue=actualPrice*5/100;
      actualPrice=actualPrice+gstValue
    }

    // Calculate the total price after discount
    const totalPrice = actualPrice - discountValue;

    // Create the booking
    const booking = new Booking({
      bookingId,
      cityName,
      tripType,
      category,
      actualPrice,
      discountValue,
      totalPrice,
      bookingDate,
      bookingTime,
      pickupDate,
      pickupTime,
      pickupAddress,
      dropAddress,
      extraPerKm,
      extraPerHour:extraPerHr,
      paymentMode,
      status: "confirmed"
    });


    // console.log(booking);
    

    // Save booking first
    await booking.save();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      let userDiscount;
      if (user.discount && user.discount.tripType === tripType && user.discount.lastDate >= new Date()) {
        userDiscount = user.discount;
        if (userDiscount) {
          booking.voucherDiscount = userDiscount.rate;
          booking.totalPrice = booking.totalPrice - userDiscount.rate;
        }
        user.discount = {};
        await user.save();
      }
      if (discountInfo && discountInfo.discountApplication === 1) {
        user.tripType = tripType;
        user.discount = {
          tripType,
          rate: discountInfo.discountValue,
          lastDate: discountInfo.expiryDate
        };
        await user.save();
      }

      booking.userId = user._id;
      await booking.save();

      user.bookingHistory.push(booking._id);
      await user.save();

      // Send confirmation email
      const bookingSubject = `Booking Confirmation ${bookingId} `;
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
             
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(user.email, bookingSubject, bookingMessage);

      if (!user.isVerify) {
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiresAt = Date.now() + 2 * 60 * 1000;
        await user.save();

        const otpSubject = '🔒 Verify Your Account';
        const otpMessage = `
          <p>Hello ${user.name},</p>
          <p>Your verification code is <strong>${otp}</strong>.</p>
        `;
        await sendEmail(user.email, otpSubject, otpMessage);
      }

      return res.status(200).json({
        success: true,
        message: "Booking created and confirmed successfully.",
        data: booking
      });
    } else {
      if (!name || !phoneNumber) {
        return next(new AppError("Name and phone number are required for new users", 400));
      }

      user = new User({
        name,
        email,
        phoneNumber,
        bookingHistory: [booking._id]
      });

      await user.save();

      booking.userId = user._id;
      await booking.save();

      const bookingSubject = `Booking Confirmation ${bookingId} `;
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
             
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(email, bookingSubject, bookingMessage);

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiresAt = Date.now() + 2 * 60 * 1000;
      await user.save();

      const otpSubject = '🔒 Verify Your Account';
      const otpMessage = `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>.</p>
      `;
      await sendEmail(email, otpSubject, otpMessage);

      return res.status(200).json({
        success: true,
        message: "Booking created and user registered successfully.",
        data: booking
      });
    }
  } catch (error) {
    console.error(error);
    return next(new AppError("An error occurred while creating the booking", 500));
  }
};




// Function to get coordinates of a location
const getCoordinates = async (location) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: location,
        key: 'AIzaSyC9ZOZHwHmyTWXqACqpZY2TL7wX2_Zn05U', // Replace with your Google API key
        region: 'IN' // Restrict results to India
      }
    });

    if (response.data && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lon: lng };
    } else {
      throw new Error('Location not found in India');
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error.message);
    return null;
  }
};

// Function to calculate distance using Google Distance Matrix API
const calculateDistanceGoogleAPI = async (fromCoordinates, toCoordinates) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins: `${fromCoordinates.lat},${fromCoordinates.lon}`,
        destinations: `${toCoordinates.lat},${toCoordinates.lon}`,
        key: 'AIzaSyC9ZOZHwHmyTWXqACqpZY2TL7wX2_Zn05U', // Replace with your Google API key
        mode: 'driving', // You can use 'walking', 'bicycling', 'transit', etc.
      }
    });

    if (response.data && response.data.rows.length > 0 && response.data.rows[0].elements.length > 0) {
      const distanceInfo = response.data.rows[0].elements[0];
      if (distanceInfo.status === 'OK') {
        return distanceInfo.distance.value / 1000; // Distance in kilometers
      } else {
        throw new Error('Unable to calculate distance');
      }
    } else {
      throw new Error('Invalid response from Google Distance Matrix API');
    }
  } catch (error) {
    console.error('Error calculating distance using Google API:', error.message);
    return null;
  }
};

// Main function to find distance between two locations
const getDistanceBetweenAirports = async (fromLocation, toLocation) => {
  try {
    const fromCoordinates = await getCoordinates(fromLocation);
    const toCoordinates = await getCoordinates(toLocation);

    if (fromCoordinates && toCoordinates) {
      const distance = await calculateDistanceGoogleAPI(fromCoordinates, toCoordinates);
      if (distance !== null) {
        console.log(`Distance between ${fromLocation} and ${toLocation} is ${distance.toFixed(2)} km.`);
        return distance;
      }
    }
  } catch (error) {
    console.error('Error calculating distance:', error.message);
  }
};

const getDistanceBetweenLocation = async (req,res,next) => {
  try {

    const {fromLocation,toLocation}=req.body
    const fromCoordinates = await getCoordinates(fromLocation);
    const toCoordinates = await getCoordinates(toLocation);

    if (fromCoordinates && toCoordinates) {
      const distance = await calculateDistanceGoogleAPI(fromCoordinates, toCoordinates);
      if (distance !== null) {
        console.log(`Distance between ${fromLocation} and ${toLocation} is ${distance.toFixed(2)} km.`);
        res.status(200).json({
          success:true,
          message:"Distance is",
          distance
        })
      }else{
        return next(new AppError("Distance not Found",402))
      }
    }
  } catch (error) {
     return next(new AppError(error.message,500))
  }
};



const addAirpotBooking = async (req, res, next) => {
  try {
    let {
      fromLocation, gst,extraPerKm,rate, airpotAddress, tripType, category, bookingDate, bookingTime, pickupDate, pickupTime, name, email, phoneNumber, voucherCode, paymentMode,distance,airpotValue
    } = req.body;


    console.log("req.body",req.body);
    console.log(voucherCode);
    

   let totalDistance= getDistanceBetweenAirports(fromLocation,  airpotAddress);

   console.log(totalDistance);
   

   if(!totalDistance || totalDistance>70){
    return next(new AppError("Sorry Service is UnAvailable"))
   }

   if(totalDistance<=30){
      totalDistance=30
   }else{
      if(totalDistance<=40){
        totalDistance=45
      }else{
        if(totalDistance<=50){
          totalDistance=50
        }else{
          totalDistance=70
        }
      }
   }

    const now = new Date();
    if (!bookingDate) {
      bookingDate = getLocalDate() // YYYY-MM-DD format
    }
    if (!bookingTime) {
      bookingTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // 12-hour format (e.g., 2:30 PM)
    }
    
    // Validate required fields

    // console.log(fromLocation,toLocation,tripType,category,bookingDate,bookingTime,pickupDate,pickupTime,email,pickupAddress,dropAddress,paymentMode);

    if (!fromLocation || !airpotAddress   || !tripType || !category || !pickupDate || !pickupTime || !email || !paymentMode) {
      console.log("kya mai chala kya bhai");
      return next(new AppError("All required fields must be provided", 400));
    }

    const bookingId = await generateBookingId(bookingDate);

    // const { valid, message } = validateTime(bookingDate, bookingTime);
    // if (!valid) {.
    //   return next(new AppError(message, 400));
    // }

    // Validate pickup time
    const pickupTimeValidation = validateTime(pickupDate, pickupTime);
    if (!pickupTimeValidation.valid) {
      return next(new AppError(pickupTimeValidation.message, 400));
    }






    // Fetch city rate if it's a One-Way Trip
    let actualPrice = 0;

    const airpotRate = await airpotCategory.findOne({ name: category });
    console.log(airpotRate);
    
    if (!airpotRate) {
      return next(new AppError("Rate information not found for the specified route", 400));
    }
    console.log(airpotRate);

    actualPrice=rate

    // if (tripType === 'Airport Trip') {
    //   console.log(category);
      
  
      
    //   // Convert distance to string if necessary to match the schema type
    //   const distanceStr = distance.toString();

    //   // console.log(totalDistance);
      
      
    //   // // Find rate for the exact distance
    //   // const rateObj = airpotRate.rates.find(rate => rate.kilometer === distanceStr);

    //   // console.log(rateObj);
      
      
    //   // if (!rateObj) {
    //   //   return next(new AppError("Rate category not found for the specified distance", 400));
    //   // }
      
    //   // Extract the rate and calculate the actual price
    //    actualPrice = rateObj.rate;
      
 
    //   // Now, you can proceed with the calculated actualPrice
    //   console.log(`The price for this route is: ${actualPrice}`);
      
    //   // Return the price or perform further actions
      
    // }

    // Initialize discount
    let discountValue = 0;

    // Handle voucher code if provided
    let discountInfo
    if (voucherCode) {
       discountInfo = await Discount.findOne({
        voucherCode: voucherCode, // Assuming the discount document has a 'code' field
        active: true,
        $or: [
          { expiryDate: { $exists: false } }, // No expiry date means always valid
          { expiryDate: { $gte: new Date() } } // Check if expiry date is not in the past
        ]
      });

      if (discountInfo && discountInfo.tripType===tripType) {
        const discountExpiryDate = moment(discountInfo.expiryDate).endOf('day');
        const discountExpiryTime = moment(discountInfo.expiryTime, 'h:mm A');

        // Check if the current date and time are within the discount's expiry date and time
        if (discountExpiryDate.isBefore(new Date()) || 
            (discountExpiryDate.isSame(new Date(), 'day') && discountExpiryTime.isBefore(moment()))) {
          return next(new AppError("Discount has expired", 400));
        }

        // Check if actual price meets the discount limit
        if (actualPrice >= discountInfo.discountLimit) {
          // Apply discount based on its type
          if (discountInfo.discountType === 1) {
            // Percentage discount
            discountValue = (actualPrice * discountInfo.discountValue) / 100;
          } else if (discountInfo.discountType === 2) {
            // Fixed discount
            discountValue = discountInfo.discountValue;
          }
        } else {
          return next(new AppError("Price does not meet the discount limit", 400));
        }
      }
    }

    if(gst){
      const gstValue=actualPrice*5/100;
      actualPrice=actualPrice+gstValue
    }

    // Calculate the total price after discount
    const totalPrice = actualPrice - discountValue;
    let pickupAddress=""
    let dropAddress=""
    if(airpotValue===1){
        pickupAddress=fromLocation
        dropAddress=airpotAddress
    }else{
      pickupAddress=airpotAddress
      dropAddress=fromLocation
    }



    // Create the booking
    const booking = new Booking({
      bookingId,
      fromLocation,
      airpotAddress,
      dropAddress,
      tripType,
      category,
      actualPrice,
      discountValue,
      totalPrice,
      bookingDate,
      bookingTime,
      pickupDate,
      pickupTime,
      pickupAddress,
      dropAddress,
      airpotValue,
      paymentMode,
      distance,
      extraPerKm,
      status: "confirmed" // Set status to confirmed,

    });

    // Save booking first
    await booking.save();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      let userDiscount;
      // If user exists, apply discount to the user's discount info
      if (user.discount && user.discount.tripType === tripType && user.discount.lastDate >= new Date()) {
        userDiscount = user.discount;
        if (userDiscount) {
          booking.voucherDiscount = userDiscount.rate;
          booking.totalPrice = booking.totalPrice - userDiscount.rate;
        }
        user.discount = {};
        await user.save();
      }
      if (discountInfo && discountInfo.discountApplication === 1) {
        // Apply discount to user's future trips
        user.tripType = tripType;
        user.discount = {
          tripType,
          rate: discountInfo.discountValue,
          lastDate: discountInfo.expiryDate
        };
        await user.save();
      }

      // Update booking with userId
      booking.userId = user._id;
      await booking.save();

      // Update user's booking history
      user.bookingHistory.push(booking._id);
      await user.save();

      // Send booking confirmation email to existing user
      const bookingSubject = `Booking Confirmation ${bookingId} `;
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
             
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(user.email, bookingSubject, bookingMessage);

      // If user exists but is not verified, send OTP email as well
      if (!user.isVerify) {
        const otp = generateOTP();
        const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        const otpSubject = '🔒 Verify Your Account';
        const otpMessage = `
          <p>Hello ${user.name},</p>
          <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
          <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        `;
        await sendEmail(user.email, otpSubject, otpMessage);
      }

      return res.status(200).json({
        success: true,
        message: "Booking created and confirmed successfully.",
        data: booking
      });
    } else {
      // Create a new user
      if (!name || !phoneNumber) {
        return next(new AppError("Name and phone number are required for new users", 400));
      }

      user = new User({
        name,
        email,
        phoneNumber,
        password:phoneNumber,
        bookingHistory: [booking._id]
      });

      if (discountInfo && discountInfo.discountApplication === 1) {
        // Apply discount to user's future trips
        user.tripType = tripType;
        user.discount = {
          tripType,
          rate: discountInfo.discountValue,
          lastDate: discountInfo.expiryDate
        };
      }

      // Save new user
      await user.save();

      // Update booking with userId
      booking.userId = user._id;
      await booking.save();

      // Send booking confirmation email to new user
      const bookingSubject = 'Booking Confirmation';
      const bookingMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="text-align: left; padding: 8px;">Booking Information</th>
              <th style="text-align: left; padding: 8px;">Details</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
            </tr>
          </table>
      
          <br />
          
          <p><strong>Terms and Conditions:</strong></p>
          <ul>
            <li>Charges for additional hours and kilometers will be billed separately.</li>
            <li>Full payment for the booking is required before the trip.</li>
            <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
            <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
          </ul>
      
          <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
      
          <br />
          
          <p><strong>Contact Information:</strong></p>
          <p>Country Code: +${91}</p>
          <p>Phone Number: ${9358585237}</p>
          <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
          <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
      
          <br />
          
          <p>Thank you for booking with us!</p>
          <p>Best regards,<br>UCS CAB Support Team</p>
        </div>
      `;
      await sendEmail(email, bookingSubject, bookingMessage);

      // Send OTP for email verification
      const otp = generateOTP();
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const otpSubject = '🔒 Verify Your Account';
      const otpMessage = `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
        <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      `;
      await sendEmail(email, otpSubject, otpMessage);

      return res.status(200).json({
        success: true,
        message: "Booking created and confirmation email sent successfully.",
        data: booking
      });
    }
  } catch (error) {
    console.error(error);
    return next(new AppError("Something went wrong while creating the booking", 500));
  }
};


const addRoundTripBooking = async (req, res, next) => {
  try {
    let {
      fromLocation, toLocation,gst,extraPerKm,perKm, tripType,pickupAddress, category, bookingDate, bookingTime, pickupDate, pickupTime, returnDate, name, email, phoneNumber, voucherCode, paymentMode, distance
    } = req.body;

    console.log("req.body", req.body);
    console.log(fromLocation, toLocation);

    // Calculate distance between locations and double it for round trips
    let totalDistance = await getDistanceBetweenAirports(fromLocation, toLocation);

    console.log(`Total distance for round trip: ${totalDistance}`);
    
    // Fetch round trip rate based on the category
    // const roundTripRate = await roundCategoryModel.findOne({ name: category });
    // Calculate total days between pickupDate and returnDate
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    let totalDays = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    console.log(`Total days between pickup and return: ${totalDays}`);
    totalDays=totalDays+1


    // Calculate cost by days
    const dailyRate = 250; // Example daily rate
    const distanceByDays = (dailyRate * totalDays);
    console.log(`Distance by days (dailyRate * totalDays): ${distanceByDays}`);

    // Calculate distance for the round trip (2-way)
    const roundTripDistance = totalDistance * 2;

    // console.log("round trip distance",roundTripDistance);
    // console.log(roundTripRate.perKm);
    

    // Calculate the cost for the distance
    const distanceCost = (roundTripDistance * perKm)
    const distanceDayCost=(distanceByDays*(perKm))
    console.log(`Distance cost (roundTripDistance * rate per km): ${distanceCost}`);

    // Choose the greater value between distance cost and distance by days
    let actualPrice = Math.max(distanceCost, distanceDayCost);
    console.log(`The actual price (greater of distanceCost and distanceByDays): ${actualPrice}`);

    // Validate required fields
    if (!fromLocation || !toLocation || !tripType || !category || !pickupDate || !pickupTime || !returnDate || !email || !paymentMode) {
      return next(new AppError("All required fields must be provided", 400));
    }

    const bookingId = await generateBookingId(bookingDate);

    // Validate pickup and return times
    const pickupTimeValidation = validateTime(pickupDate, pickupTime);
    if (!pickupTimeValidation.valid) {
      return next(new AppError(pickupTimeValidation.message, 400));
    }

    // Handle discount logic (same as in the airport trip)
    let discountValue = 0;
    let discountInfo;
    if (voucherCode) {
      discountInfo = await Discount.findOne({
        voucherCode,
        active: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: new Date() } }
        ]
      });

      console.log(discountInfo);
      

      if (discountInfo && discountInfo.tripType === "Round Trip" ) {
        console.log("aa raha hu main");
        
        const discountExpiryDate = moment(discountInfo.expiryDate).endOf('day');
        const discountExpiryTime = moment(discountInfo.expiryTime, 'h:mm A');

        // Check if the current date and time are within the discount's expiry date and time
        if (discountExpiryDate.isBefore(new Date()) ||
          (discountExpiryDate.isSame(new Date(), 'day') && discountExpiryTime.isBefore(moment()))) {
          return next(new AppError("Discount has expired", 400));
        }

        // Apply discount based on its type
        if (actualPrice >= discountInfo.discountLimit) {
          if (discountInfo.discountType === 1) {
            discountValue = (actualPrice * discountInfo.discountValue) / 100;
          } else if (discountInfo.discountType === 2) {
            discountValue = discountInfo.discountValue;
          }
        } else {
          return next(new AppError("Price does not meet the discount limit", 400));
        }
      }
    }

    if(gst){
      const gstValue=actualPrice*5/100;
      actualPrice=actualPrice+gstValue
    }

    // Calculate total price after discount
    const totalPrice = actualPrice - discountValue;

    // Create the booking
    const booking = new Booking({
      bookingId,
      fromLocation,
      toLocation,
      tripType,
      category,
      actualPrice,
      discountValue,
      totalPrice,
      bookingDate,
      returnDate,
      bookingTime,
      pickupDate,
      pickupTime,
      extraPerKm,
      pickupAddress,
      distance,
      paymentMode,
      status: "confirmed"
    });

    // Save booking and handle user logic
    await booking.save();
    let user = await User.findOne({ email });
    



    if (!user) {
      if (!name || !phoneNumber) {
        return next(new AppError("Name and phone number are required for new users", 400));
      }
      user = new User({
        name,
        email,
        phoneNumber,
        password: phoneNumber,
        bookingHistory: [booking._id]
      });



      await user.save();
      const otp = generateOTP();
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const otpSubject = '🔒 Verify Your Account';
      const otpMessage = `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
        <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      `;
      await sendEmail(email, otpSubject, otpMessage);

  

    } else {
      booking.userId = user._id;
      await booking.save();

      user.bookingHistory.push(booking._id);
      await user.save();
    }

    

    // Send confirmation email
    const bookingSubject = `Booking Confirmation ${bookingId} `;
    const bookingMessage = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear ${user.name},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 8px;">Booking Information</th>
            <th style="text-align: left; padding: 8px;">Details</th>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Trip Type</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.tripType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">From</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.fromLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">To</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.toLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Actual Price</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.actualPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Discount Applied</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.discountValue.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Price</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Date</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingDate.toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Booking Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Pickup Address</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Drop Address</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.dropAddress}</td>
          </tr>
        </table>
    
        <br />
        
        <p><strong>Terms and Conditions:</strong></p>
        <ul>
          <li>Charges for additional hours and kilometers will be billed separately.</li>
          <li>Full payment for the booking is required before the trip.</li>
          <li>Cancellation of the trip less than 24 hours before the booking time will incur a 50% charge.</li>
          <li>The vehicle is expected to be returned in its original condition, or cleaning charges will apply.</li>
        </ul>
    
        <p>We strive to continuously improve our services and value your feedback. If you have any suggestions or concerns, feel free to contact us.</p>
    
        <br />
        
           
        <p><strong>Contact Information:</strong></p>
        <p>Country Code: +${91}</p>
        <p>Phone Number: ${9358585237}</p>
        <p>Email: <a href="mailto:"info@gmail.com" style="color: #0066cc;">info@gmail.com</a></p>
        <p>Website: <a href="ucscab.com" target="_blank" style="color: #0066cc;">ucscab.com</a></p>
    
        <br />
        
        <p>Thank you for booking with us!</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      </div>
    `;
    
    await sendEmail(user.email, bookingSubject, bookingMessage);

    return res.status(200).json({
      success: true,
      message: "Round trip booking created and confirmed successfully.",
      data: booking
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Something went wrong while creating the booking", 500));
  }
};


const verifyOneWayBooking = async (req, res, next) => {
  try {
    const { email, otp, bookingId } = req.body;

    if (!email || !otp || !bookingId) {
      return next(new AppError("All fields are required", 400));
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if the OTP matches and is not expired
    if (user.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    if (Date.now() > user.otpExpiresAt) {
      return next(new AppError("OTP has expired", 400));
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isVerify = true;
    await user.save();

    // Find and validate the booking
    const validBooking = await Booking.findById(bookingId);

    if (!validBooking) {
      return next(new AppError("Booking not found", 404));
    }

    if (validBooking.userId.toString() !== user._id.toString()) {
      return next(new AppError("Booking and user do not match", 403));
    }

    if(!validBooking.status==="pending"){
      return next(new AppError("Booking is not Valid",402))
    }

    // Check if the booking date is today
    const currentDate = new Date();
    const bookingDate = new Date(validBooking.bookingDate);

    if (bookingDate.toDateString() === currentDate.toDateString()) {
      // Booking date is today; check the time
      const bookingTime = validBooking.bookingTime; // Expecting time in HH:MM:SS format
      const bookingDateTime = new Date(`${currentDate.toDateString()} ${bookingTime}`);
      
      // Ensure booking time is not in the past
      if (Date.now() > bookingDateTime.getTime()) {
        validBooking.status="cancelled"
        await validBooking.save()
        return next(new AppError("Booking time has already passed", 400));
      }
    } else if (bookingDate < currentDate) {
      // Booking date is in the past (not today)
        validBooking.status="cancelled"

      

        await validBooking.save()
      return next(new AppError("Booking date is in the past and is no longer valid", 400));
    }


    validBooking.status="confirmed"

    await validBooking.save()
    
          // Send booking confirmation email
          const subject = 'Booking Confirmation';
          const message = `
            <p>Dear ${user.name},</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <ul>
              <li>Trip Type: ${validBooking.tripType}</li>
              <li>From: ${validBooking.fromLocation}</li>
              <li>To: ${validBooking.toLocation}</li>
              <li>Category: ${validBooking.category}</li>
              <li>Actual Price: $${validBooking.actualPrice.toFixed(2)}</li>
              <li>Discount Applied: $${validBooking.discountValue.toFixed(2)}</li>
              <li>Total Price: $${validBooking.totalPrice.toFixed(2)}</li>
              <li>Booking Date: ${validBooking.bookingDate.toLocaleDateString()}</li>
              <li>Booking Time: ${validBooking.bookingTime}</li>
            </ul>
            <p>Thank you for booking with us!</p>
            <p>Best regards,<br>UCS CAB Support Team</p>
          `;
          await sendEmail(user.email, subject, message);



    // Booking date and time are valid
    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      data: user
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};
const getOneWayBooking=async(req,res,next)=>{
    try{
          const {fromLocation,toLocation}=req.body

          console.log(req.body);
          

          const allAvailableCars = await CityRate.find({ fromCity: fromLocation, toCity: toLocation });
        
          if(!allAvailableCars){
            return next(new AppError("No Car Available",404))
          }
          
          res.status(200).json({
            success:true,
            message:"All Car Avaiable",
            data:allAvailableCars
          })


    }catch(error){
        return next(new AppError(error.message,500))
    }
}
const cancelOneWayBooking = async (req, res, next) => { 
  try{
    
    // authorized for admin left
     const {id}=req.params

     const validBooking=await Booking.findById(id)

     if(validBooking.status==="cancelled"){
      return next(new AppError("Booking is canceled already",402))
     }

     if(validBooking.status==="ongoing"){
      return next(new AppError("Booking is onGoing Already",402))
     }

     if(validBooking.status==="complete"){
      return next(new AppError("Booking is complete already",402))
     }

     validBooking.status="cancelled"

     await validBooking.save()
     
     const subject = 'Your Driver Details Have Been Updated';
     const text = `Dear Customer,
     Your Booking is Canceled
 
 
 Thank you for using our service.
 
 Best regards,
 The Team`;
 
 const validUser=await User.findById(validBooking.userId)
 
 await sendEmail(validUser.email,subject,text)



     res.status(200).json({
      success:true,
      message:"Booking is cancelled succesfully",
      data:validBooking
     })

  }catch(error){
    return next(new AppError(error.message,500))
  }


};
const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminId, driverDetails} = req.body;

    // Check if the admin is valid and authorized
    const validAdmin = await Admin.findById(adminId);

    console.log(validAdmin);
    
    // if (!validAdmin || !validAdmin.status) {
    //   return next(new AppError("You are not Authorized", 403));
    // }

    // Find the booking to approve
    const validBooking = await Booking.findById(id);

    
    
    if (!validBooking) {
      return next(new AppError("Booking Not Found", 404));
   
    }

    // Check the booking status and completeness
    if (validBooking.status) {
      return next(new AppError("Booking is already approved", 403));
    }
    
    console.log(validBooking);
    

    // if (validBooking.isComplete || validBooking.isCancel) {
    //   return next(new AppError("Booking is completed or canceled, something went wrong", 400));
    // }

    // Set driver details and update the booking status
    // const driverDetails = {
    //   name: "Ayush Mishra",
    //   phoneNumber: "6388291292",
    //   email: "ayushm185@gmail.com",
    //   carNumber: "CA1234",
    // };

    console.log(validBooking);
    

    validBooking.driverDetails = driverDetails;
    validBooking.status = true;


    console.log(validBooking);
    

    // Save the updated booking
    await validBooking.save();

    // Get the user associated with the booking
    const validUser = await User.findById(validBooking.userId);
    if (!validUser) {
      return next(new AppError("User Not Found", 404));
    }

    // Prepare email content for the user
    const subject = '🔒 Booking Confirmation';
    const bookingConfirmationMessage = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box;">
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <img src="https://img.icons8.com/ios-filled/50/0074f9/car--v1.png" alt="Car Icon" style="width: 40px; margin-bottom: 15px;">
            <p style="font-size: 1.2rem; font-weight: bold; margin: 0;">Hello, ${validUser.name}</p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Your booking from <strong>${validBooking.fromLocation}</strong> to <strong>${validBooking.toLocation}</strong> for a <strong>${validBooking.tripType}</strong> trip has been confirmed.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              <strong>Booking Details:</strong><br>
              Name: ${validUser.name}<br>
              Email: ${validUser.email}<br>
              Phone Number: ${validUser.phoneNumber}<br>
              Booking Date: ${validBooking.bookingDate || '0000-00-00'}<br>
              Fare Price: ${validBooking.price}
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              <strong>Driver Details:</strong><br>
              Driver Name: ${driverDetails.name}<br>
              Phone Number: ${driverDetails.phoneNumber}<br>
              Email: ${driverDetails.email}<br>
              Car Number: ${driverDetails.carNumber}
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Please contact the driver directly for any further assistance.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Have a safe and pleasant journey!<br>
              UCS CAB Support Team
            </p>
          </td>
        </tr>
      </table>`;

    // Send email to the user
    await sendEmail(validUser.email, subject, bookingConfirmationMessage);

    // Prepare email content for the admin
    const bookingApprovalMessageForAdmin = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box;">
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <img src="https://img.icons8.com/ios-filled/50/0074f9/car--v1.png" alt="Car Icon" style="width: 40px; margin-bottom: 15px;">
            <p style="font-size: 1.2rem; font-weight: bold; margin: 0;">Dear Admin,</p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              The booking for <strong>${validUser.name}</strong> from <strong>${validBooking.fromLocation}</strong> to <strong>${validBooking.toLocation}</strong> for a <strong>${validBooking.tripType}</strong> trip has been approved.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              <strong>Booking Details:</strong><br>
              Name: ${validUser.name}<br>
              Email: ${validUser.email}<br>
              Phone Number: ${validUser.phoneNumber}<br>
              Booking Date: ${validBooking.bookingDate || '0000-00-00'}<br>
              Fare Price: ${validBooking.price}
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              <strong>Driver Details:</strong><br>
              Driver Name: ${driverDetails.name}<br>
              Phone Number: ${driverDetails.phoneNumber}<br>
              Email: ${driverDetails.email}<br>
              Car Number: ${driverDetails.carNumber}
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              The customer has been notified of the booking approval and provided with the driver details.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Thank you for managing the booking.<br>
              UCS CAB Support Team
            </p>
          </td>
        </tr>
      </table>`;

    // Send email to the admin
    await sendEmail(adminEmail, subject, bookingApprovalMessageForAdmin);

   
    

    res.status(200).json({
      success: true,
      message: "Booking Approved Successfully",
      data: validBooking
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};
const getAllBooking = async (req, res, next) => {
  try {
      // Fetch all bookings that are not canceled and have status true
      const bookings = await Booking.find().populate('userId', 'name email phoneNumber'); // Adjust fields as needed

      console.log(bookings);
      

      if (bookings.length === 0) {
          return next(new AppError("No bookings found", 404));
      }

      res.status(200).json({
          success: true,
          message: "Bookings details:",
          data: bookings
      });

  } catch (error) {
      return next(new AppError(error.message, 500));
  }
};

const getSingleBooking=async(req,res,next)=>{
  try{
    const {id}=req.params

    // const singleBooking=await Booking.findById(id)
    const singleBooking = await Booking.findById(id).populate('userId', 'name email phoneNumber'); // Adjust fields as needed


    if(!singleBooking){
      return next(new AppError("SINGLE BOOKIN NOT FOUND",500))
    }

    res.status(200).json({
      success:true,
      message:"All Single Booking",
      data:singleBooking
    })

  }catch(error){
    return next(new AppError(error.message,500))
  }
}

const bookComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { extraRates } = req.body;

    if (!extraRates) {
      extraRates = 0;
    }

    // Admin authorization
    console.log(id);
    
    const validBooking = await Booking.findById(id);

    console.log(validBooking);
    

    if (!validBooking) {
      console.log("mai aaya hu kya");
      
      return next(new AppError("Booking is not Valid", 404));
    }

    // Convert pickupDate and pickupTime to Date object
    const pickupDate = new Date(validBooking.pickupDate); // ISO format
    const [pickupHours, pickupMinutesPart] = validBooking.pickupTime.split(':');
    const [pickupMinutes, ampm] = pickupMinutesPart.split(' ');

    let hours = parseInt(pickupHours, 10);
    const minutes = parseInt(pickupMinutes, 10);

    // Convert 12-hour format to 24-hour format
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    // Create a Date object for pickup date and time
    const pickupDateTime = new Date(pickupDate.setHours(hours, minutes, 0, 0));

    // Get current date and time
    const currentDateTime = new Date();

    // Check if pickup date and time have passed
    if (pickupDateTime > currentDateTime) {
      return next(new AppError("Booking cannot be marked complete before the pickup date and time", 400));
    }

    if (validBooking.status === "ongoing") {
      validBooking.status = "complete";
      const extraPrice = extraRates * 10;
      const totalPrice = validBooking.totalPrice + extraPrice;

      validBooking.extraKm = extraRates;
      validBooking.extraPrice = extraPrice;
      validBooking.totalPrice = totalPrice;

      await validBooking.save();
    } else {
      return next(new AppError("Booking is Yet Not Ongoing", 400));
    }

    const subject = 'Your Driver Details Have Been Updated';
    const text = `Dear Customer,
    Your Booking is completed.

Thank you for using our service.

Best regards,
The Team`;

    const validUser = await User.findById(validBooking.userId);
    await sendEmail(validUser.email, subject, text);

    res.status(200).json({
      success: true,
      message: "Booking is Complete Successfully",
      data: validBooking
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
}

const driverDetail = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, carNumber } = req.body;
    const { id } = req.params;

    console.log(req.body);
    

    if (!name || !email || !phoneNumber) {
      return next(new AppError("All fields are required", 400));
    }

    const validBooking = await Booking.findById(id);

    if (!validBooking) {
      return next(new AppError("Booking not found", 404));
    }

    if (validBooking.status !== "confirmed") {
      return next(new AppError("Booking is not valid", 400));
    }

    // Deactivate old driver details
    validBooking.driverDetails.forEach(driver => {
      driver.isActive = false;
    });

    // Add new driver details as active
    validBooking.driverDetails.push({
      name,
      phoneNumber,
      email,
      carNumber,
      isActive: true,
      updatedAt: new Date()
    });

    // Send email to user
    const subject = 'Your Driver Details Have Been Updated';
    const text = `Dear Customer,
    Your driver details have been updated successfully.
Driver Name: ${name}
Phone Number: ${phoneNumber}
Email: ${email}
Car Number: ${carNumber}

Thank you for using our service.

Best regards,
The Team`;

    const validUser = await User.findById(validBooking.userId);

    if (validUser && validUser.email) {
      await sendEmail(validUser.email, subject, text);
    }

    await validBooking.save();

    res.status(200).json({
      success: true,
      message: "Driver details updated successfully",
      data: validBooking
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
}

const updateRate=async(req,res,next)=>{
  try{
    const {id}=req.params
    const {extraRates}=req.body

    console.log(extraRates);

    if(!extraRates){
      return next(new AppError("Extra Rates is Required",404))
    }
    
    const validBooking=await Booking.findById(id)

    if(!validBooking){
      return next(new AppError("Booking is not Valid",400))
    }
   
    if(!validBooking.status==="confirmed"){
      return next(new AppError("Booking is not Confirmed"))
    }

    const extraPrice=extraRates*10

    const totalPrice=validBooking.totalPrice+extraPrice

    validBooking.extraKm=extraRates
    validBooking.extraPrice=extraPrice
    validBooking.totalPrice=totalPrice

    validBooking.save()

    res.status(200).json({
      success:true,
      message:"Rate Updated Succesfully",
      data:validBooking
    })


  }catch(error){
     return next(new AppError(error.message,500))
  }
}

 const getBookingsNearCurrentTime = async (req, res) => {
  const { userId } = req.params;

  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Define the start and end of the time range
  const startTime = new Date(now.getTime() - thirtyMinutes);
  const endTime = new Date(now.getTime() + thirtyMinutes);

  try {
    // Find bookings for the user within the time range
    const bookings = await Booking.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          pickupDate: {
            $gte: startTime,
            $lte: endTime
          }
        }
      },
      {
        $addFields: {
          pickupDateTime: {
            $dateFromParts: {
              year: { $year: "$pickupDate" },
              month: { $month: "$pickupDate" },
              day: { $dayOfMonth: "$pickupDate" },
              hour: { $hour: { $concat: ["$pickupTime", ":00"] } }, // Assuming pickupTime is in HH:MM format
              minute: { $minute: { $concat: ["$pickupTime", ":00"] } },
              second: 0
            }
          }
        }
      },
      {
        $match: {
          pickupDateTime: {
            $gte: startTime,
            $lte: endTime
          }
        }
      },
      {
        $count: "numberOfBookings"
      }
    ]);

    // Extract the count of bookings
    const numberOfBookings = bookings.length > 0 ? bookings[0].numberOfBookings : 0;

    res.json({ numberOfBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'An error occurred while fetching bookings.' });
  }
}





export {
    addOneWayBooking,
    getOneWayBooking,
    cancelOneWayBooking,
    getAllBooking,
    approveBooking,
    getSingleBooking,
    bookComplete,
    verifyOneWayBooking,
    driverDetail,
    updateRate,
    addLocalTripBooking,
    addAirpotBooking,
    addRoundTripBooking,
    getDistanceBetweenAirports,
    getDistanceBetweenLocation,
    getBookingsNearCurrentTime
}