import { Router } from "express";
import { addPaymentMode, getPaymentMode, updatePaymentMode } from "../controllers/paymentMode/paymentMode.controller.js";

const paymentModeRoute=Router()




paymentModeRoute.post("/",addPaymentMode)
paymentModeRoute.get("/",getPaymentMode)
paymentModeRoute.put("/:id",updatePaymentMode)




export default paymentModeRoute