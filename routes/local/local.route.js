import { Router } from "express";
import { addLocalCategory, deletLocalCategory, editLocalCategory, getByLocationCategory } from "../../controllers/Local/LocalCategory.js";
import { addCity, addRate, deleteRate, deleteSpecificCategory, getAllCityNames, getByLocation, getRate, laad, updateLocalRate, updateRate} from "../../controllers/Local/LocalRateChart.js";
import { addLocalTC, getLocalTc } from "../../controllers/Local/LocalTC.js";
import upload from "../../middleware/multer.middlware.js";





const localCategoryRoute=Router()

localCategoryRoute.post("/",upload.single("photo"),addLocalCategory)
localCategoryRoute.get("/",getByLocationCategory)
localCategoryRoute.get("/city",getAllCityNames)
localCategoryRoute.put("/:id",upload.single("photo"),editLocalCategory)
localCategoryRoute.delete("/:id",deletLocalCategory)



localCategoryRoute.post("/addRate",addRate)
localCategoryRoute.post("/add/city",addCity)
localCategoryRoute.get("/getRate",getRate)
localCategoryRoute.delete("/rate/delete",deleteRate)
localCategoryRoute.put("/rate/update",updateLocalRate)
localCategoryRoute.get("/getLocation",getByLocation)
localCategoryRoute.delete("/rate/deleteCity",deleteSpecificCategory)


localCategoryRoute.post("/tc",addLocalTC)
localCategoryRoute.get("/tc",getLocalTc)

// localCategoryRoute.get("/getLocation/category",getBy)


export default localCategoryRoute