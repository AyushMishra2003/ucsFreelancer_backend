import { Router } from "express";
import { getDistanceBetweenAirports, getDistanceBetweenLocation } from "../controllers/Booking/OneWayBooking.controller.js";


const distanceRoute=Router()


distanceRoute.post("/",getDistanceBetweenLocation)



export default distanceRoute
