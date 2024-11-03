import { Router } from "express";
import { addLocalTC, deleteSpecificTc, editTC, getLocalTc, getSpecificTc } from "../controllers/Local/LocalTC.js";



const termRoute=Router()



termRoute.post("/",addLocalTC)
termRoute.get("/",getLocalTc)
termRoute.post("/trip",getSpecificTc)
termRoute.post("/delete",deleteSpecificTc)
termRoute.post("/update",editTC)

export default termRoute