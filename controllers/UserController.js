import User from "../models/users/user.model.js";
import AppError from "../utilis/error.utlis.js";
import sendEmail from "../utilis/sendEmail.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
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

    console.log("req.body is",req.body);
    

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
        fs.rm(`uploads/${req.file.filename}`);
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

      console.log(email,otp);
      
  
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


const getUser=async(req,res,next)=>{
    try{

        const allUser=await User.find({})

        if(!allUser){
            return next(new AppError("User Not Found"))
        }

        res.status(200).json({
            success:true,
            message:"All User are:-",
            data:allUser
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const deleteUser=async(req,res,next)=>{
    try{

        const {id}=req.params

        const user=await User.findById(id)

        if(!user){
            return next(new AppError("Users Not Found"))
        }

        await User.findByIdAndDelete(id)

        res.status(200).json({
            success:true,
            message:"Users Delete Succesfully"
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const singleUser=async(req,res,next)=>{
    try{

        const {id}=req.params

        const user=await User.findById(id)

        if(!user){
            return next(new AppError("User Not Found",404))
        }

        res.status(200).json({
            success:true,
            message:"User are:-",
            data:user
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const forget_passoword=async(req,res,next)=>{
    try{

        const {email}=req.body
    
        const validUser=await User.findOne({email})

        if(!validUser){
            return next(new AppError("Users Not Found",404))
        }

        if(!validUser.isVerify){
            return next(new AppError("User Registration is Not Complete,please Complete Registration",400))
        }

        const otp=generateOTP()
        const otpExpiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

        validUser.otp=otp
        validUser.otpExpiresAt=otpExpiresAt

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

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const verifyforget_password=async(req,res,next)=>{
    try{

        const {email,otp,newPassword}=req.body

        if(!email || !otp || !newPassword){
            return next(new AppError("All Field are Required",400))
        }

        const user=await User.findOne({email})

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

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const userLogin=async(req,res,next)=>{
    try{

        const {email,password}=req.body

        if(!email || !password){
            return next(new AppError("All Field are Required",404))
        }

        const validUser=await User.findOne({email})

        if(!validUser){
            return next(new AppError("Users is Not Found",404))
        }

        // if(!validUser.isVerify){
        //     return next(new AppError("Account is Not Verified",401))
        // }

        if(validUser.password!==password){
            return next(new AppError("Password is Wrong",401))
        }
        
        // if(!validUser.status){
        //     return next(new AppError("Not Autherication to Login",402))
        // }

        const token = await validUser.generateJWTToken()
        res.cookie('token', token, cookieOption)
        

        console.log(token);
        

        res.status(200).json({
            success:true,
            message:"Login Succesfully!",
            validUser
        })



    }catch(error){
        return next(new AppError(error.message))
    }
}


const changeStatus=async(req,res,next)=>{
    try{

        const {id}=req.params

        const user=await User.findById(id)

        if(!user){
            return next(new AppError("User not Found",404))
        }

        user.status=!user.status

        await user.save()

        res.status(200).json({
            success:true,
            message:"User Status Changed",
            data:user
        })
    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const resendOtp=async(req,res,next)=>{
  try{
     
    const {email}=req.body

    if(!email){
      return next(new AppError("Email is Required"))
    }

    const validUser=await User.findOne({email})

    if(!validUser){
      return next(new AppError("User is Not Valid",400))
    }

    if(validUser.isVerify){
      return next(new AppError("User is already verified",402))
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
      success:true,
      message:"RESNET OTP SENT Succesfully",
      existingUser
    })


   
  }catch(error){
    return next(new AppError(error.messagem,500))
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
    resendOtp
}