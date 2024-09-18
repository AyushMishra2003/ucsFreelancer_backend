import { Router } from "express";
import Discount from "../../models/discount/discount.model.js";
import { addDiscount, changeStatus, deleteDiscount, discount, fetchDiscount, getDiscount, updateDiscount, updateExpiryDate, validateDiscountCode } from "../../controllers/Discount/Disocunt.controller.js";



const discountRoute=Router()


discountRoute.post("/",addDiscount)
discountRoute.get("/",getDiscount)
discountRoute.put("/:id",changeStatus)
discountRoute.put("/update/:id",updateDiscount)
discountRoute.put("/:id/expiry",updateExpiryDate)
discountRoute.get("/fetch",fetchDiscount)
discountRoute.post("/valid",validateDiscountCode)
discountRoute.delete("/:id",deleteDiscount)



export default  discountRoute