import OperatorAuthModel from "../../models/operator_auth/operatorAuth.model.js"
import AppError from "../../utilis/error.utlis.js"
import RoleModel from "../../models/operator_auth/role.model.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { verifyPassword, hashPassword, encrypt, decrypt, verifyToken } from "../../utilis/auth.utlis.js";
import jwt from 'jsonwebtoken';

const addOperator = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role || role.length === 0) {
            return next(new AppError("All fields including role are required", 400));
        }

        if (password.length < 6) {
            return next(new AppError("Password must be at least 6 characters", 400));
        }

        if (name.length > 50) {
            return next(new AppError("Name must be less than 50 characters", 400))
        }

        if (!validator.isEmail(email)) {
            return next(new AppError("Email is not Valid", 400))
        }

        // Check if the email is already registered
        const existingOperator = await OperatorAuthModel.findOne({ email });
        if (existingOperator) {
            return next(new AppError("Operator with this email already exists", 400));
        }

        // Validate roles: Convert role names/IDs to ObjectIds
        const roleObjects = await RoleModel.find({ _id: { $in: role } });
        if (roleObjects.length !== role.length) {
            return next(new AppError("One or more roles are invalid", 400));
        }

        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        const hashedPassword = await hashPassword(password)

        // const isMatched=verifyPassword(password,hashedPassword)

        // console.log(isMatched)

        // Create the operator with roles
        const newOperator = new OperatorAuthModel({
            name,
            email,
            password: hashedPassword,
            role: roleObjects.map(role => role._id), // Ensure only ObjectIds are stored,
        });

        await newOperator.save();

        res.status(201).json({
            success: true,
            message: "Operator added successfully",
            data: newOperator
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


const getOperator = async (req, res, next) => {
    try {
        const allOperator = await OperatorAuthModel.find({}).populate("role");

        if (allOperator.length === 0) {
            return next(new AppError("No operator found", 404));
        }

        res.status(200).json({
            success: true,
            message: "All operators",
            data: allOperator
        });
    } catch (error) {
        return next(new AppError(error.message, 500))
    }
}


const loginOperator = async (req, res, next) => {
    try {

        const { email, password } = req.body


        console.log(req.body);
        

        if (!email || !password) {
            return next(new AppError("Email and Password are required", 400))
        }

        const operator = await OperatorAuthModel.findOne({email})

        console.log(operator);
        

        if (!operator) {
            return next(new AppError("Invalid credentials", 400))
        }

        if(operator.status==="inactive"){
             return next(new AppError("Invalid User",401))
        }

        const isMatched = await verifyPassword(password, operator.password)

        console.log(isMatched);
        


        if (!isMatched) {
            
            return next(new AppError("Invalid credentials", 400))
        }

        const encryptedUserId = await encrypt(operator._id.toString());

    
        const token = jwt.sign({ operatorId: encryptedUserId }, process.env.SECRET, { expiresIn: "2d" });

        operator.token = token

        await operator.save()

        console.log(operator);
        

        // Set the token in an HTTP-only secure cookie
        res.cookie('authToken', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'None',
            maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
        });


        res.status(200).json({
            success: true,
            message: "Login successful",
            data: operator
        })


    } catch (error) {
        return next(new AppError(error.message, 500))
    }
}

const operatorLogout=async(req,res,next)=>{
     try{

        res.clearCookie('authToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
          });
      
          res.status(200).json({
            success: true,
            message: "Logout Succesfully"
          })


     }catch(error){
          return next(new AppError(error.message,500))
     }
}

const updateStatus=async(req,res,next)=>{
     try{

        const {id}=req.params

        const validOperator=await OperatorAuthModel.findById(id)

        if(!validOperator){
             return next(new AppError("Operator Not Found",400))
        }

        validOperator.status = validOperator.status === "active" ? "inactive" : "active";

        const encryptedUserId = await encrypt(validOperator._id.toString());

        const token = jwt.sign({ operatorId: encryptedUserId }, process.env.SECRET, { expiresIn: "2d" });

        validOperator.token=token

        await validOperator.save()

        res.status(200).json({
            success:true,
            message:"Status Updated Succesfully",
            data:validOperator
        })


     }catch(error){

     }
}



const isValidUser=async(req,res,next)=>{
     try{

        const token = req.cookies?.authToken;

        if(!token){
              return next(new AppError("User not Looged In",400))
        }

        const decoded = verifyToken(token);
        console.log("Decoded Token:", decoded);

        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decoded.exp < currentTime) {
            return next(new AppError("Token Expired", 400));
        }


        const validOperator=await OperatorAuthModel.findById(decoded?.userId)

        if(!validOperator){
              return next(new AppError("Operaotor Not Found",404))
        }

        if(validOperator.token!=token){
            return next(new AppError("Authentication Failed",401))
        }

        res.status(200).json({
            success:true,
            message:"User is Valid",
            data:validOperator
        })

     }catch(error){
         return next(new AppError(error.message,500))
     }
}




export { addOperator, getOperator,loginOperator,operatorLogout,updateStatus ,isValidUser};
