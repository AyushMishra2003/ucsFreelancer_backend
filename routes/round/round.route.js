import { Router } from "express";
import { addRoundCategory, addRoundRate, deleteRoundCategory, getRoundCategory, updateRoundCategory } from "../../controllers/Round/RoundCategory.js";
import upload from "../../middleware/multer.middlware.js";
import { addCityName, deleteCityName, getCityName, updateCityName } from "../../controllers/Round/RoundCityName.js";
import { addRoundCity, deleteRoundCity, deleteRoundCityRate, editRoundCityRate, getRoundAllCity, getRoundCity, getRoundCityRate } from "../../controllers/Round/RoundRate.js";



const roundRouter=Router()


roundRouter.post("/",upload.single("photo"),addRoundCategory)
roundRouter.get("/",getRoundCategory)
roundRouter.post("/rate/:id",addRoundRate)
roundRouter.put("/:id",upload.single('photo'),updateRoundCategory)
roundRouter.delete("/:id",deleteRoundCategory)



roundRouter.post("/city",addCityName)
roundRouter.get("/city",getRoundAllCity)
roundRouter.put("/city/:id",updateCityName)
roundRouter.delete("/city/:id",deleteCityName)


roundRouter.post("/city/rate",addRoundCity)

roundRouter.delete("/city/rate/delete",deleteRoundCity)
roundRouter.put("/city/rate/p1",editRoundCityRate)
roundRouter.delete("/city/rate/dlt",deleteRoundCityRate)
roundRouter.post("/city/rate/list",getRoundCity)
roundRouter.get("/city/rate/all/list",getRoundCityRate)
roundRouter.get("/city/list",getRoundAllCity)



export default roundRouter