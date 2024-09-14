import { Router } from "express";
import { addRoundCategory, deleteRoundCategory, getRoundCategory, updateRoundCategory } from "../../controllers/Round/RoundCategory.js";
import upload from "../../middleware/multer.middlware.js";
import { addCityName, deleteCityName, getCityName, updateCityName } from "../../controllers/Round/RoundCityName.js";



const roundRouter=Router()


roundRouter.post("/",upload.single("photo"),addRoundCategory)
roundRouter.get("/",getRoundCategory)
roundRouter.put("/:id",upload.single('photo'),updateRoundCategory)
roundRouter.delete("/:id",deleteRoundCategory)



roundRouter.post("/city",addCityName)
roundRouter.get("/city",getCityName)
roundRouter.put("/city/:id",updateCityName)
roundRouter.delete("/city/:id",deleteCityName)


export default roundRouter