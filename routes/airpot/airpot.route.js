import { Router } from "express";
import { addAirpotCategory, addAirpotRate, deletAirpotCategory, deleteAirportRate, editAirpotCategory, getAirpotCategory, getAirpotCity, getAllAirpotCities, getByAirpotCategory, updateAirportRate } from "../../controllers/airpot/airpotCategory.controller.js";
import upload from "../../middleware/multer.middlware.js";''


const airpotRoute=Router()


airpotRoute.post("/",upload.single("photo"),addAirpotCategory)
airpotRoute.put("/:id",upload.single("photo"),editAirpotCategory)
airpotRoute.post("/rate",addAirpotRate)
airpotRoute.delete("/rate",deleteAirportRate)
airpotRoute.put("/rate",updateAirportRate)
airpotRoute.post("/rate/list",getAirpotCity)
airpotRoute.get("/rate/alllist",getAllAirpotCities)
airpotRoute.get("/",getByAirpotCategory)
airpotRoute.get("/category",getAirpotCategory)
// airpotRoute.put("/:id",editAirpotCategory)
airpotRoute.delete("/:id",deletAirpotCategory)


export default airpotRoute
