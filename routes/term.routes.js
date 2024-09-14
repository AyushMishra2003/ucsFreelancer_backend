import { Router } from "express";
import { addLocalTC, getLocalTc, getSpecificTc } from "../controllers/Local/LocalTC.js";



const termRoute=Router()



termRoute.post("/",addLocalTC)
termRoute.get("/",getLocalTc)
termRoute.post("/trip",getSpecificTc)

export default termRoute