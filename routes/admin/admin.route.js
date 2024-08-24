import { Router } from "express";
import { addAdmin, allOperator, changePassword, changeStatus, loginAdmin, logoutAdmin, updateAdmin } from "../../controllers/AdminController.js";



const adminRoute=Router()

adminRoute.post("/add",addAdmin)
adminRoute.post("/login",loginAdmin)
adminRoute.put("/update/:id",updateAdmin)
adminRoute.post("/logout",logoutAdmin)
adminRoute.post("/status",changeStatus)
adminRoute.post("/password/:id",changePassword)
adminRoute.get("/operator",allOperator)


export default adminRoute