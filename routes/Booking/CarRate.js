import { Router } from "express";
import { addRate, deleteRate, deleteSpecificCategory, getByLocation, getByLocationCategory, getRate, updateRate } from "../../controllers/CityRateController.js";




const cityRate=Router()

cityRate.post("/",addRate)
cityRate.get("/",getRate)
cityRate.get("/location",getByLocation)
cityRate.get("/category",getByLocationCategory)
cityRate.delete("/category",deleteRate)
cityRate.put("/category",updateRate)
cityRate.delete("/specific",deleteSpecificCategory)




export default cityRate