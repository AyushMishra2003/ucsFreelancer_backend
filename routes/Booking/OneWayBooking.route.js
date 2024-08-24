import { Router } from "express";
import {  addOneWayBooking, approveBooking, bookComplete, cancelOneWayBooking, driverDetail, getAllBooking, getOneWayBooking, getSingleBooking, updateRate, verifyOneWayBooking } from "../../controllers/Booking/OneWayBooking.controller.js";




const oneWayBookingRoute=Router()


oneWayBookingRoute.post("/",addOneWayBooking)
// oneWayBookingRoute.get("/available",getOneWayBooking)
// oneWayBookingRoute.put("/verify",verifyOneWayBooking)
oneWayBookingRoute.post("/cancel/:id",cancelOneWayBooking)
oneWayBookingRoute.get("/allbooking",getAllBooking)
oneWayBookingRoute.get("/allbooking/:id",getSingleBooking)
// oneWayBookingRoute.post("/book/confirm/:id",approveBooking)
oneWayBookingRoute.post("/book/complete/:id",bookComplete)
oneWayBookingRoute.put("/driver/:id",driverDetail)
oneWayBookingRoute.put("/rate/:id",updateRate)



export default oneWayBookingRoute


