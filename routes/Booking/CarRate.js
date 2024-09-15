import { Router } from "express";
import { addRate, deleteRate, deleteSpecificCategory, getAllCities, getByLocation, getByLocationCategory, getRate, updateRate } from "../../controllers/CityRateController.js";
import { getByLocation as getByLocation1 } from "../../controllers/Local/LocalRateChart.js";



const cityRate=Router()

cityRate.post("/",addRate)
cityRate.get("/",getRate)
cityRate.get("/allcity",getAllCities)
cityRate.post("/location/oneway",getByLocation)
cityRate.get("/location/local",getByLocation1)
cityRate.get("/category",getByLocationCategory)
cityRate.delete("/category",deleteRate)
cityRate.put("/category",updateRate)
cityRate.delete("/specific",deleteSpecificCategory)




export default cityRate