import { Router } from "express";
import upload from "../../middleware/multer.middlware.js";
import { addOneWayCategory, deleteOneWayCategory, getOneWayCategory, updateOneWayCategory } from "../../controllers/oneWay/oneway.controller.js";


const oneWayRouter=Router()



oneWayRouter.post("/",upload.single("photo"),addOneWayCategory)

oneWayRouter.get("/",getOneWayCategory)

oneWayRouter.put("/:id",upload.single("photo"),updateOneWayCategory)

oneWayRouter.delete("/:id",deleteOneWayCategory)


export default oneWayRouter