import jwt from 'jsonwebtoken';
import OperatorAuthModel from '../models/operator_auth/operatorAuth.model.js';
import AppError from '../utilis/error.utlis.js';
import { verifyToken } from '../utilis/auth.utlis.js';

export const isLogin = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies?.authToken;
        console.log("Token received:", token);

        // Check if token exists
        if (!token) {
           return  next()
        }

        // Verify token
        const decoded = verifyToken(token);


        // Check token expiration
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decoded.exp > currentTime) {
            return next(new AppError("Already LoginIn", 401));
        }

        next();
    } catch (error) {
        return next(new AppError(`Authentication error: ${error.message}`, 500));
    }
};
