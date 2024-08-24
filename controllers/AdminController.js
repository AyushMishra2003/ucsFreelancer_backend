import { rmSync } from "fs";
import Admin from "../models/admin/admin.model.js";
import AppError from "../utilis/error.utlis.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const cookieOption = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
}

const addAdmin=async(req,res,next)=>{
  try{

    const {email,password,role,name}=req.body

    if(!email || !password){
        return next(new AppError("All field are Required",404))
    }

    const validAdmin=await Admin.findOne({email})

    if(validAdmin){
        return next(new AppError("Email Already Exist"))
    }
   
    const admin=await Admin.create(
        {
        email,
        password,
        profile:{
            public_id: "",
            secure_url: "",
        },
       role,
       name

    }
    )

    if(role){
        addAdmin.role=role
    }

    if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        if (result) {
          (admin.profile.public_id = result.public_id),
            (admin.profile.secure_url = result.secure_url);
        }
        fs.rm(`uploads/${req.file.filename}`);
      }
  

    if(!admin){
        return next(new AppError("Admin Not Created",400))
    }
   
    await admin.save()

    res.status(200).json({
        success:true,
        message:"Admin Created Succesfully",
        data:admin
    })


  }catch(error){
    return  next(new AppError(error.message,500))
  }
}


const loginAdmin=async(req,res,next)=>{
 try{
  
   const {email,password}=req.body

   if(!email || !password){
    return next(new AppError("All filed are Required",400))
   }


   const verifyAdmin=await Admin.findOne({email})

   if(!verifyAdmin){
    return next(new AppError("Admin Not Found",404))
   }

//    console.log(verifyAdmin);
   

   if(verifyAdmin.password!==password){
    return  next(new AppError("Password is Incorrect"))
   }

   if(!verifyAdmin.status){
    return next(new AppError("Not Authorization",403))
   }

   const token = await verifyAdmin.generateJWTToken()
   res.cookie('token', token, cookieOption)
   
   

   res.status(200).json({
       success:true,
       message:"Login Succesfully!",
       data:verifyAdmin
   })


 }catch(error){
    return next(new AppError(error.message,500))
 }
}

const updateAdmin = async (req, res, next) => {
    try {
      const {  newEmail, profileDetails } = req.body;

      const {id}=req.params

 
  
    //   if (!email) {
    //     return next(new AppError("Email is required to find the admin", 400));
    //   }
  
      // Find the admin by email
      const admin = await Admin.findById(id);
  
      if (!admin) {
        return next(new AppError("Admin not found", 404));
      }
       
      if(!admin.status){
        return next(new AppError("Not Authrozied",403))
      }
      // Update profile details if provided
      if (profileDetails) {
        admin.profile = {
          ...admin.profile,
          ...profileDetails
        };
      }
  
      // Handle profile image upload if a file is provided
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms',
        });
  
        if (result) {
          // Delete old image from Cloudinary if it exists
          if (admin.profile.public_id) {
            await cloudinary.v2.uploader.destroy(admin.profile.public_id);
          }
          admin.profile.public_id = result.public_id;
          admin.profile.secure_url = result.secure_url;
        }
  
        // Clean up local file
        fs.rm(`uploads/${req.file.filename}`, (err) => {
          if (err) {
            console.error('Error removing file:', err);
          }
        });
      }
  
      // Update the email if provided
      if (newEmail && newEmail !== email) {
        admin.email = newEmail;
      }
  
      // Save the updated admin
      await admin.save();
  
      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        data: admin,
      });
  
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
}

const logoutAdmin = (req, res,next) => {
     console.log("logout admin");
     
    // Clearing the token cookie
    const token = ""
    const cookiesOption = {
        logoutAt: new Date(), httpOnly: true, secure: true,
        sameSite: 'None',
    }
    try {
        res.cookie("token", token, cookiesOption)
        res.status(200).json({ success: true, message: "Logged out" })
    }
    catch (e) {
        // Handling any unexpected errors
        return res.status(500).json({ success: false, message: e.message })
    }
}


const changeStatus=async(req,res,next)=>{
    try{

        const {email}=req.body
        console.log(email);
        


        const validAdmin=await Admin.findOne({email})

        console.log(validAdmin);
        

        if(!validAdmin){
            return next(new AppError("Admin Not Found",404))
        }

        if(validAdmin.role==="Admin"){
            return next(new AppError("You are not Authorized",403))
        }

        validAdmin.status=!validAdmin.status

         await validAdmin.save()

        res.status(200).json({
            success:true,
            message:"Status Changed Succesfully",
            data:validAdmin
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const changePassword=async(req,res,next)=>{
    try{

        const {id}=req.params

        const {newPassword}=req.body

        const validAdmin=await Admin.findById(id)

        console.log(validAdmin);
        

        if(!validAdmin){
            return next(new AppError("Admin is not Valid",404))
        }

        if(validAdmin.role==="Admin"){
            return next(new AppError("You are not Authorized",404))
        }

        validAdmin.password=newPassword

        await validAdmin.save()

        res.status(200).json({
            success:true,
            message:"Password changed Succesfully",
            data:validAdmin
        })
    }catch(error){
        return next(new AppError(error.message))
    }
}

const allOperator=async(req,res,next)=>{
    try{
        const operators = await Admin.find({ role: "Operator" });
       

        if(!operators){
            return next(new AppError("Operator Not Found",404))
        }

        res.status(200).json({
            success:true,
            message:"All Operators",
            data:operators
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

export {
    addAdmin,
    loginAdmin,
    updateAdmin,
    changePassword,
    logoutAdmin,
    changeStatus,
    allOperator
}