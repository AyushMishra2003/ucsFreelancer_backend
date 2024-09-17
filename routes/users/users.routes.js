import { Router } from "express";
import { addUser, changePassword, changeStatus, deleteUser, forget_passoword, getBookingHistory, getUser, resendOtp, singleUser, updateProfile, userLogin, userLogout, verifyforget_password, verifyOTP } from "../../controllers/UserController.js";
import upload from "../../middleware/multer.middlware.js";
import { addAirpotBooking } from "../../controllers/DistanceController.js";


const userRouter = Router()



userRouter.post("/add", upload.single("profile"), addUser)
userRouter.post("/verify", verifyOTP)
userRouter.get("/users", getUser)
userRouter.post("/change-password", changePassword)
userRouter.put("/updateProfile/:id", upload.single("profile"), updateProfile)
userRouter.delete("/delete/:id", deleteUser)
userRouter.get("/single/:id", singleUser)
userRouter.post("/forget", forget_passoword)
userRouter.post("/verifyPassword", verifyforget_password)
userRouter.post("/login", userLogin)
userRouter.get("/logout", userLogout)
userRouter.post("/status/:id", changeStatus)
userRouter.post("/distance", addAirpotBooking)
userRouter.get("/history/:id",getBookingHistory)

export default userRouter