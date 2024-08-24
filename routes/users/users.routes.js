import { Router } from "express";
import { addUser, changeStatus, deleteUser, forget_passoword, getUser,  singleUser, userLogin, verifyforget_password, verifyOTP } from "../../controllers/UserController.js";
import upload from "../../middleware/multer.middlware.js";

const userRouter=Router()



userRouter.post("/add",upload.single("profile"),addUser)
userRouter.post("/verify",verifyOTP)
userRouter.get("/users",getUser)
userRouter.delete("/delete/:id",deleteUser)
userRouter.get("/single/:id",singleUser)
userRouter.post("/forget",forget_passoword)
userRouter.post("/verifyPassword",verifyforget_password)
userRouter.post("/login",userLogin)
userRouter.post("/status/:id",changeStatus)



export default userRouter