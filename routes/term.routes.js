import { Router } from "express";
import { addLocalTC, getLocalTc, getSpecificTc } from "../controllers/Local/LocalTC.js";



const termRoute=Router()



termRoute.post("/",addLocalTC)
termRoute.get("/",getLocalTc)
termRoute.get("/trip",getSpecificTc)

export default termRoute