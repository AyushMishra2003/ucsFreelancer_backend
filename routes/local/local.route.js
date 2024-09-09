import { Router } from "express";
import { addLocalCategory, deletLocalCategory, editLocalCategory, getByLocationCategory } from "../../controllers/Local/LocalCategory.js";
import { addCity, addRate, deleteRate, deleteSpecificCategory, getByLocation, getRate, laad, updateLocalRate, updateRate} from "../../controllers/Local/LocalRateChart.js";






const localCategoryRoute=Router()

localCategoryRoute.post("/",addLocalCategory)
localCategoryRoute.get("/",getByLocationCategory)
localCategoryRoute.put("/:id",editLocalCategory)
localCategoryRoute.delete("/:id",deletLocalCategory)



localCategoryRoute.post("/addRate",addRate)
localCategoryRoute.post("/add/city",addCity)
localCategoryRoute.get("/getRate",getRate)
localCategoryRoute.delete("/rate/delete",deleteRate)
localCategoryRoute.put("/rate/update",updateLocalRate)
localCategoryRoute.get("/getLocation",getByLocation)
localCategoryRoute.delete("/deleteCity",deleteSpecificCategory)

// localCategoryRoute.get("/getLocation/category",getBy)


export default localCategoryRoute