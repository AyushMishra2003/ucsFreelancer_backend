import { Router } from "express";
import {addOperator, deleteOperator, editOperator, getOperator, isValidUser, loginOperator, operatorLogout, updateStatus} from "../../controllers/operator/operatorAuth.controller.js";
import { isLogin } from "../../middleware/isLogin.middleware.js";
import { isAdmin } from "../../middleware/isAdmin.middleware.js";


const operatorAuthRoute=Router()

// operatorAuthRoute.post("/",isAdmin,addOperator)
operatorAuthRoute.post("/",addOperator)
operatorAuthRoute.get("/",getOperator)
operatorAuthRoute.put("/:id",editOperator)
// operatorAuthRoute.post("/login",isLogin,loginOperator)
operatorAuthRoute.post("/login",loginOperator)
operatorAuthRoute.post("/logout",operatorLogout)
// operatorAuthRoute.get("/status/:id",isAdmin,updateStatus)
operatorAuthRoute.get("/status/:id",updateStatus)
operatorAuthRoute.get("/valid/user",isValidUser)
operatorAuthRoute.delete("/:id",deleteOperator)

export default operatorAuthRoute