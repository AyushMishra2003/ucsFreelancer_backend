import { Router } from "express";
import { addAirpotCategory, addAirpotRate, deletAirpotCategory, editAirpotCategory, getAirpotCategory, getByAirpotCategory, updateAirpotRate } from "../../controllers/airpot/airpotCategory.controller.js";
import upload from "../../middleware/multer.middlware.js";''


const airpotRoute=Router()


airpotRoute.post("/",upload.single("photo"),addAirpotCategory)
airpotRoute.post("/rate/:id",addAirpotRate)
airpotRoute.put("/rate/:id",updateAirpotRate)
airpotRoute.get("/",getByAirpotCategory)
airpotRoute.get("/category",getAirpotCategory)
airpotRoute.put("/:id",editAirpotCategory)
airpotRoute.delete("/:id",deletAirpotCategory)


export default airpotRoute
