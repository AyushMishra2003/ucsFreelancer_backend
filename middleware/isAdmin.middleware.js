import OperatorAuthModel from "../models/operator_auth/operatorAuth.model.js";
import { verifyToken } from "../utilis/auth.utlis.js";
import AppError from "../utilis/error.utlis.js"

export const isAdmin = async (req, res, next) => {
    try {

        const token = req.cookies.authToken;
        const decoded = verifyToken(token);
        
        if(!decoded){
             return next(new AppError("Not Logged in",401))
        }
        
        const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
        if (decoded.exp < currentTime) {
             return next(new AppError("Admin Not Logged in",400))
        }


        const validOperator=await OperatorAuthModel.findOne({ _id: decoded.userId })

    
        if(!validOperator){
              return next(new AppError("Operator Not Found",400))
        }

        if(!validOperator.isAdmin){
             return next(new AppError("Invalid Admin",400))
        }

        
        next()


        }catch (error) {
            return next(new AppError)
        }
}