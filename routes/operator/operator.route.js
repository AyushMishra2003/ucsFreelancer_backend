import { Router } from "express";
import { addRole, deleteRole, getRole, updateRole } from "../../controllers/operator/role.controller.js";


const opeatorRoute=Router()


opeatorRoute.post("/",addRole)
opeatorRoute.get("/",getRole)
opeatorRoute.put("/:id",updateRole)
opeatorRoute.delete("/:id",deleteRole)

export default opeatorRoute


