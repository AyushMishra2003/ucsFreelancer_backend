import mongoose from "mongoose";
import Booking from "../models/Booking/Booking.model.js";
import User from "../models/users/user.model.js";
import AppError from "../utilis/error.utlis.js";
import sendEmail from "../utilis/sendEmail.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
const { ObjectId } = mongoose.Types;



const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString(); // Generates a 5-digit OTP
};
const cookieOption = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: 'None',
}

const addUser = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phoneNumber) {
      return next(new AppError("All fields are required", 400));
    }

    console.log("req.body is", req.body);


    // Additional checks can go here...

    // Continue with user creation
    const otp = generateOTP();
    let existingUser = await User.findOne({ email });
    let user
    if (existingUser) {
      if (!existingUser.isVerify) {
        existingUser.otp = otp;
        existingUser.otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now
        await existingUser.save();
      } else {
        return next(new AppError("Account is already verified", 402));
      }
    } else {
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

      user = new User({
        name,
        email,
        password,
        phoneNumber,
        otp,
        otpExpiresAt,
        profile: {
          public_id: "",
          secure_url: "",
        }
      });

      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        if (result) {
          user.profile.public_id = result.public_id;
          user.profile.secure_url = result.secure_url;
        }
     
      }

      await user.save();
    }

    const subject = '🔒 Verify Your Account';
    const message = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box;">
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <img src="https://img.icons8.com/ios-filled/50/0074f9/lock.png" alt="Lock Icon" style="width: 40px; margin-bottom: 15px;">
            <p style="font-size: 1.2rem; font-weight: bold; margin: 0;">Hello, ${name}</p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              This code will expire in 2 minutes. If you did not request this, please ignore this email.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Aao Chalein,<br>
              UCS CAB  Support Team
            </p>
          </td>
        </tr>
      </table>`;

    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address. Please verify your account.",
      user
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    console.log(email, otp);


    if (!email || !otp) {
      return next(new AppError("Email and OTP are required", 400));
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("User not found", 404));
    }



    // Check if the OTP matches and is not expired
    if (user.otp != otp) {
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

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      user
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


const getUser = async (req, res, next) => {
  try {

    const allUser = await User.find({})

    if (!allUser) {
      return next(new AppError("User Not Found"))
    }

    res.status(200).json({
      success: true,
      message: "All User are:-",
      data: allUser
    })

  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}




const getBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params; // User ID from request params

    console.log("User ID is", id);

    // Step 1: Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("User not found", 404)); // Handle case where user is not found
    }

    // Step 2: Check if the user has a bookingHistory array
    if (!user.bookingHistory || user.bookingHistory.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No booking history found for this user",
        bookingHistory: [] // Return empty array if no history found
      });
    }

    // Step 3: Convert booking IDs to ObjectId instances
    const bookingIds = user.bookingHistory.map(id => new ObjectId(id));

    // Step 4: Find bookings by the array of booking IDs
    const bookingHistory = await Booking.find({
      _id: { $in: bookingIds }
    });

    res.status(200).json({
      success: true,
      message: "Booking history retrieved successfully",
      bookingHistory
    });

  } catch (error) {
    console.error(error); // Log error to console for debugging
    return next(new AppError(error.message, 500)); // Handle any errors
  }
};



const changePassword = async (req, res, next) => {
  try {
    // Extracting old and new passwords from the request body and user ID from request user
    const { oldPassword, newPassword, id } = req.body;

    // Validating required fields
    if (!oldPassword || !newPassword) {
      return next(new AppError('All fields are required', 400));
    }

    // Ensuring the new password is different from the old password
    if (oldPassword === newPassword) {
      return next(new AppError('New password is same as old password', 400));
    }

    // Finding the user by ID and selecting the password field
    const user = await User.findById(id).select('+password');

    // Handling scenarios where the user is not found
    if (!user) {
      return next(new AppError('User does not exist', 400));
    }

    // Validating the old password (assuming 'comparePassword' is a custom method for comparing passwords)
    const passwordValid = await user.password === oldPassword;

    // Handling scenarios where the old password is incorrect
    if (!passwordValid) {
      return next(new AppError('Old Password is wrong', 400));
    }

    // Updating user's password (hashing should occur in the model's pre-save hook)
    user.password = newPassword;  // Direct assignment without bcrypt in the controller
    await user.save();

    // Removing sensitive information before sending the response
    user.password = undefined;

    // Sending success response to the client
    res.status(200).json({
      success: true,
      message: 'Password Changed successfully'
    });
  } catch (e) {
    // Handling any unexpected errors
    return next(new AppError(e.message, 500));
  }
};


const deleteUser = async (req, res, next) => {
  try {

    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return next(new AppError("Users Not Found"))
    }

    await User.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "Users Delete Succesfully"
    })

  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}

const singleUser = async (req, res, next) => {
  try {

    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return next(new AppError("User Not Found", 404))
    }

    res.status(200).json({
      success: true,
      message: "User are:-",
      user
    })

  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}

const forget_passoword = async (req, res, next) => {
  try {

    const { email } = req.body

    const validUser = await User.findOne({ email })

    if (!validUser) {
      return next(new AppError("Users Not Found", 404))
    }

    if (!validUser.isVerify) {
      return next(new AppError("User Registration is Not Complete,please Complete Registration", 400))
    }

    const otp = generateOTP()
    const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

    validUser.otp = otp
    validUser.otpExpiresAt = otpExpiresAt

    await validUser.save()


    const subject = '🔒 Verify Your Account';
    const message = `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box;">
            <tr>
              <td style="text-align: center; padding: 20px 0;">
                <img src="https://img.icons8.com/ios-filled/50/0074f9/lock.png" alt="Lock Icon" style="width: 40px; margin-bottom: 15px;">
                <p style="font-size: 1.2rem; font-weight: bold; margin: 0;">Hello, ${validUser.name}</p>
                <p style="font-weight: 400; text-align: center; margin: 20px 0;">
                  Your verification code is <strong>${otp}</strong>. Please use this code to complete your change Password.
                </p>
                <p style="font-weight: 400; text-align: center; margin: 20px 0;">
                  This code will expire in 2 minutes. If you did not request this, please ignore this email.
                </p>
                <p style="font-weight: 400; text-align: center; margin: 20px 0;">
                  Aao Chalein,<br>
                  UCS CAB  Support Team
                </p>
              </td>
            </tr>
          </table>`;

    // Send the OTP via email
    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address. Please verify your account.",
    });

  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}


const verifyforget_password = async (req, res, next) => {
  try {

    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return next(new AppError("All Field are Required", 400))
    }

    const user = await User.findOne({ email })

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    console.log(user);
    console.log(user.otp);
    console.log(otp);



    // Check if the OTP matches and is not expired
    if (user.otp != otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    if (Date.now() > user.otpExpiresAt) {
      return next(new AppError("OTP has expired", 400));
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password Changed successfully",
      user
    });

  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}


const userLogin = async (req, res, next) => {
  try {

    const { email, password } = req.body

    if (!email || !password) {
      return next(new AppError("All Field are Required", 404))
    }

    const validUser = await User.findOne({ email })

    if (!validUser) {
      return next(new AppError("Users is Not Found", 404))
    }

    console.log(validUser);


    // if(!validUser.isVerify){
    //     return next(new AppError("Account is Not Verified",401))
    // }

    if (validUser.password !== password) {
      return next(new AppError("Password is Wrong", 401))
    }

    // if(!validUser.status){
    //     return next(new AppError("Not Autherication to Login",402))
    // }

    const token = await validUser.generateJWTToken()
    res.cookie('token', token, cookieOption)


    console.log(token);


    res.status(200).json({
      success: true,
      message: "Login Succesfully!",
      validUser
    })



  } catch (error) {
    return next(new AppError(error.message))
  }
}


const changeStatus = async (req, res, next) => {
  try {

    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return next(new AppError("User not Found", 404))
    }

    user.status = !user.status

    await user.save()

    res.status(200).json({
      success: true,
      message: "User Status Changed",
      data: user
    })
  } catch (error) {
    return next(new AppError(error.message, 500))
  }
}

const resendOtp = async (req, res, next) => {
  try {

    const { email } = req.body

    if (!email) {
      return next(new AppError("Email is Required"))
    }

    const validUser = await User.findOne({ email })

    if (!validUser) {
      return next(new AppError("User is Not Valid", 400))
    }

    if (validUser.isVerify) {
      return next(new AppError("User is already verified", 402))
    }


    const otp = generateOTP();
    let existingUser = await User.findOne({ email });
    let user
    if (existingUser) {
      if (!existingUser.isVerify) {
        existingUser.otp = otp;
        existingUser.otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now
        await existingUser.save();
      } else {
        return next(new AppError("Account is already verified", 402));
      }
    } else {
      const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now
    }

    const subject = '🔒 Resent Otp';
    const message = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box;">
        <tr>
          <td style="text-align: center; padding: 20px 0;">
            <img src="https://img.icons8.com/ios-filled/50/0074f9/lock.png" alt="Lock Icon" style="width: 40px; margin-bottom: 15px;">
            <p style="font-size: 1.2rem; font-weight: bold; margin: 0;">Hello, ${"Ayush Msihra"}</p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Your verification code is <strong>${otp}</strong>. Please use this code to complete your registration.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              This code will expire in 2 minutes. If you did not request this, please ignore this email.
            </p>
            <p style="font-weight: 400; text-align: center; margin: 20px 0;">
              Aao Chalein,<br>
              UCS CAB  Support Team
            </p>
          </td>
        </tr>
      </table>`;

    await sendEmail(email, subject, message);



    res.status(200).json({
      success: true,
      message: "RESNET OTP SENT Succesfully",
      existingUser
    })



  } catch (error) {
    return next(new AppError(error.messagem, 500))
  }
}


const userLogout = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      secure: true,
      maxAge: 0,
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const updateProfile = async (req, res, next) => {
  try {
    // Extracting full name and user ID from the request body and user
    const { name, phoneNumber,isVerify } = req.body
    const { id } = req.params
    console.log(id)
    console.log(req.body.name)

    // Finding the user by ID
    const user = await User.findById(id)

    // Handling scenarios where the user is not found
    if (!user) {
      return next(new AppError('User does not exist', 400))
    }

    // Updating user's full name if provided
    if (name) {
      user.name = await name
    }

    if (phoneNumber) {
      user.phoneNumber = await phoneNumber
    }
    if (isVerify) {
      user.isVerify = await isVerify
    }


    console.log(user.profile)


    // Handling profile upload using cloudinary if a file is present in the request
    // if (req.file) {
    //   // Destroying the previous profile in cloudinary

    //   if (user.profile.publicId) {
    //     await cloudinary.v2.uploader.destroy(user.profile.publicId)
    //   }
    //   try {
    //     // Uploading the new profile to cloudinary
    //     const result = await cloudinary.v2.uploader.upload(req.file.path, {
    //       folder: 'lms',
    //       width: 250,
    //       height: 250,
    //       gravity: 'faces',
    //       crop: 'fill',
    //     })
    //     // Updating user's profile information
    //     if (result) {
    //       console.log(result)
    //       user.profile.publicId = result.public_id
    //       user.profile.secure_url = result.secure_url

    //       // Removing the temporary file after profile upload
    //       fs.rm(uploads/${req.file.filename})
    //     }
    //   }
    //   catch (err) {
    //     // Handling errors during profile upload
    //     return next(new AppError('File can not get uploaded', 500))
    //   }
    // }

    // Saving the updated user document
    await user.save()

    // Sending success response to the client
    res.status(200).json({
      success: true,
      message: 'Updated!'
    })
  }
  catch (e) {
    // Handling any unexpected errors
    console.log(e.message)
    return next(new AppError(e.message, 500))
  }

}


// const verifyAccount=async(req,res,next)=>{
//     try{

//         const {email}=req.body

//         const validUser=await User.findOne({email})

//         if(!validUser){
//             return next(new AppError("User Not Found",404))
//         }

//         if(validUser.isVerify){
//             return next(new AppError)
//         }

//     }catch(error){
//         return next(new AppError(error.message,500))
//     }
// }



export {
  addUser,
  verifyOTP,
  getUser,
  deleteUser,
  singleUser,
  forget_passoword,
  verifyforget_password,
  userLogin,
  changeStatus,
  resendOtp,
  userLogout,
  changePassword,
  updateProfile,
  getBookingHistory
}