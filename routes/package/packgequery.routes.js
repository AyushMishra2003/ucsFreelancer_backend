import { Router } from "express";
import { addPackageQuery, deletePackageQuery, getAllPackageQueries, getPackageQueryById } from "../../controllers/package/package.controller.js";


const query=Router()


query.post("/",addPackageQuery)
query.get("/",getAllPackageQueries)
query.delete("/:id",deletePackageQuery)



export default query