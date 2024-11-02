import { Router } from "express";
import { addLocalTC, deleteSpecificTc, getLocalTc, getSpecificTc } from "../controllers/Local/LocalTC.js";



const termRoute=Router()



termRoute.post("/",addLocalTC)
termRoute.get("/",getLocalTc)
termRoute.post("/trip",getSpecificTc)
termRoute.post("/delete",deleteSpecificTc)

export default termRoute