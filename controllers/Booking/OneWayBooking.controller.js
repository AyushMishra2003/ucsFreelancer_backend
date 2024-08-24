import Booking from '../../models/Booking/Booking.model.js';
import User from '../../models/users/user.model.js';
import CityRate from '../../models/Booking/CityRate.js';
import Discount from '../../models/discount/discount.model.js';
import sendEmail from '../../utilis/sendEmail.js';
import AppError from '../../utilis/error.utlis.js';
import Admin from '../../models/admin/admin.model.js'

const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString(); // Generates a 5-digit OTP
};

const addOneWayBooking = async (req, res, next) => {
  try {
    const {
      fromLocation, toLocation, tripType, category, bookingDate, bookingTime, name, email, phoneNumber
    } = req.body;

    console.log(req.body);
    

    // Validate required fields
    if (!fromLocation || !toLocation || !tripType || !category || !bookingDate || !bookingTime || !email) {
      console.log("ye error");
      
      return next(new AppError("All required fields must be provided", 400));
    }

    // Validate booking date and time
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    if (isNaN(bookingDateTime.getTime()) || bookingDateTime <= new Date()) {
      return next(new AppError("Invalid or past booking date and time", 400));
    }

    // Fetch city rate if it's a One-Way Trip
    let actualPrice = 0;
    if (tripType === 'One-Way Trip') {
      const cityRate = await CityRate.findOne({ fromCity: fromLocation, toCity: toLocation });
      if (!cityRate) {
        return next(new AppError("Rate information not found for the specified route", 400));
      }
      const rateObj = cityRate.rates.find(rate => rate.category === category);
      if (!rateObj) {
        return next(new AppError("Rate category not found for the specified route", 400));
      }
      actualPrice = rateObj.rate;
    }

    // Fetch applicable discount
    let discountValue = 0;
    const currentDate = new Date();
    let discountInfo;

    discountInfo = await Discount.findOne({
      tripType,
      active: true,
      $or: [
        { expiryDate: { $exists: false } }, // No expiry date means always valid
        { expiryDate: { $gte: currentDate } } // Check if expiry date is not in the past
      ]
    });

    console.log(discountInfo);
    

    if (discountInfo && discountInfo.discountApplication === 2) {
      // Apply discount based on its type
      if (discountInfo.discountType === 1) {
        // Percentage discount
        discountValue = (actualPrice * discountInfo.discountValue) / 100;
        console.log("discount value is ",discountValue);
        
      } else if (discountInfo.discountType === 2) {
        // Fixed discount
        discountValue = discountInfo.discountValue;
      }
    }

    // Calculate the total price after discount
    const totalPrice = actualPrice - discountValue;

    // Create the booking
    const booking = new Booking({
      fromLocation,
      toLocation,
      tripType,
      category,
      actualPrice,
      discountValue,
      totalPrice,
      bookingDate: bookingDateTime,
      bookingTime,
      status: "confirmed" // Set status to confirmed
    });

    // Save booking first
    await booking.save();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log("kya mc user hai");
      console.log("discout info is",discountInfo);
      
      let userDiscount
      // If user exists, apply discount to the user's discount info
      if (user.discount && user.discount.tripType === tripType && user.discount.lastDate >= currentDate) {
        console.log("mc user",user);
        console.log(user.discount);
        
        
         userDiscount = user.discount;
         console.log(userDiscount);
         
        if(userDiscount){
          booking.vocherDiscount=userDiscount.rate
        }
         
        booking.totalPrice=booking.totalPrice-userDiscount.rate
        // user.discount = {
        //   tripType:"",
        //   rate:0,
        //   lastDate:0
        // };
        
        user.discount = {};
        console.log("mera babu user",user);
        
        await user.save()


        await User.findById(user._id)

        console.log("after babu ",  user);
        
        // await booking.save()
      }
        if (discountInfo && discountInfo.discountApplication === 1) {
          // Apply discount to user's future trips
          console.log("tu chal mai aaya");
          user.tripType=tripType
          user.discount.rate = discountInfo.discountValue;
          user.discount.lastDate = new Date(); // Update the last date
          console.log(user);
          user.discount = {
            tripType:tripType,
            rate: discountInfo.discountValue,
            lastDate:discountInfo.expiryDate
          };

          console.log(user.discount);
          
          
          await user.save();
        }

      // Update booking with userId
      booking.userId = user._id;
    
      await booking.save();

      // Update user's booking history \
      user.  bookingHistory.push(booking._id)
      await user.save();

      // Send booking confirmation email to existing user
      const bookingSubject = 'Booking Confirmation';
      const bookingMessage = `
        <p>Dear ${user.name},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <ul>
          <li>Trip Type: ${booking.tripType}</li>
          <li>From: ${booking.fromLocation}</li>
          <li>To: ${booking.toLocation}</li>
          <li>Category: ${booking.category}</li>
          <li>Actual Price: $${booking.actualPrice.toFixed(2)}</li>
          <li>Discount Applied: $${booking.discountValue.toFixed(2)}</li>
          <li>Total Price: $${booking.totalPrice.toFixed(2)}</li>
          <li>Booking Date: ${booking.bookingDate.toLocaleDateString()}</li>
          <li>Booking Time: ${booking.bookingTime}</li>
        </ul>
        <p>Thank you for booking with us!</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
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
        return next(new AppError("Name and phone number are required to create a new user", 400));
      }

      const otp = generateOTP();
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now
      


      user = new User({
        name,
        email,
        phoneNumber,
        otp,
        otpExpiresAt,
        profile: {
          public_id: "",
          secure_url: "",
        },
        password: name // Assuming password is just the name, adjust as necessary
      });

      
      if (discountInfo && discountInfo.discountApplication === 1) {
        user.tripType=tripType
        user.discount.rate = discountInfo.discountValue;
        user.discount.lastDate = new Date(); // Update the last date
        console.log(user);
        user.discount = {
          tripType:tripType,
          rate: discountInfo.discountValue,
          lastDate:discountInfo.expiryDate
        };
      }

      // Save the new user
      await user.save();

      // Update booking with userId
      booking.userId = user._id;
      await booking.save();

      // Send OTP email to new user
      const otpSubject = '🔒 Verify Your Account';
      const otpMessage = `
        <p>Hello ${name},</p>
        <p>Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.</p>
        <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      `;
      await sendEmail(email, otpSubject, otpMessage);

      // Send booking confirmation email to new user
      const bookingSubject = 'Booking Confirmation';
      const bookingMessage = `
        <p>Dear ${name},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <ul>
          <li>Trip Type: ${booking.tripType}</li>
          <li>From: ${booking.fromLocation}</li>
          <li>To: ${booking.toLocation}</li>
          <li>Category: ${booking.category}</li>
          <li>Actual Price: $${booking.actualPrice.toFixed(2)}</li>
          <li>Discount Applied: $${booking.discountValue.toFixed(2)}</li>
          <li>Total Price: $${booking.totalPrice.toFixed(2)}</li>
          <li>Booking Date: ${booking.bookingDate.toLocaleDateString()}</li>
          <li>Booking Time: ${booking.bookingTime}</li>
        </ul>
        <p>Thank you for booking with us!</p>
        <p>Best regards,<br>UCS CAB Support Team</p>
      `;
      
      await sendEmail(email, bookingSubject, bookingMessage);

      return res.status(201).json({
        success: true,
        message: "User created and booking confirmed. Please verify your account with the OTP sent to your email.",
        data: booking
      });
    }
  } catch (error) {
    return next(new AppError(error.message, 500));
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



const bookComplete=async(req,res,next)=>{ 
  try{
    const {id}=req.params

    const {extraRates}=req.body

    if(!extraRates){
      extraRates=0
    }

    //  admin authrozation

    const validBooking=await Booking.findById(id)

    if(!validBooking){
      return next(new AppError("Booking is not Valid",404))
    }

    if(validBooking.status==="confirmed"){
         validBooking.status="complete"
         const extraPrice=extraRates*10

         const totalPrice=validBooking.totalPrice+extraPrice
     
         validBooking.extraKm=extraRates
         validBooking.extraPrice=extraPrice
         validBooking.totalPrice=totalPrice
     


         await validBooking.save()
    }else{
      return next(new AppError("Booking is not Valid",400))
    }



    const subject = 'Your Driver Details Have Been Updated';
    const text = `Dear Customer,
    Your Booking is completed


Thank you for using our service.

Best regards,
The Team`;

const validUser=await User.findById(validBooking.userId)

await sendEmail(validUser.email,subject,text)


    res.status(200).json({
      success:true,
      message:"Bookig is Complete Succesfully",
      data:validBooking
    })

  }catch(error){
    return next(new AppError(error.message,500))
  }


}

const driverDetail = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, carNumber } = req.body;
    const { id } = req.params;

    if (!name || !email || !phoneNumber) {
      return next(new AppError("All fields are required", 400));
    }

    const validBooking = await Booking.findById(id);

    if (!validBooking) {
      return next(new AppError("Booking not found", 404));
    }

    if (validBooking.status !== "confirmed") {
      return next(new AppError("Booking is not Valid", 400));
    }

    // Overwrite driver details
    validBooking.driverDetails = {
      name,
      phoneNumber,
      email,
      carNumber
    };

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

const validUser=await User.findById(validBooking.userId)

await sendEmail(validUser.email,subject,text)

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
      updateRate
}