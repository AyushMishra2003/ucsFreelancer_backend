import { Router } from "express";
import { addRoundCategory, deleteRoundCategory, getRoundCategory, updateRoundCategory } from "../../controllers/Round/RoundCategory.js";
import upload from "../../middleware/multer.middlware.js";



const roundRouter=Router()


roundRouter.post("/",upload.single("photo"),addRoundCategory)



roundRouter.get("/",getRoundCategory)
roundRouter.put("/:id",upload.single('photo'),updateRoundCategory)
roundRouter.delete("/:id",deleteRoundCategory)


export default roundRouter