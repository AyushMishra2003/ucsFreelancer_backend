import { Router } from "express";
import { addPackage, deletePackage, editPackage, getAllPackages, getParticularPackage } from "../../controllers/package/package.controller.js";
import upload from "../../middleware/multer.middlware.js";

const PackageRouter=Router()

PackageRouter.post("/", upload.fields([
    { name: 'mainPhoto', maxCount: 1 },  // Expect one file for mainPhoto
    { name: 'photos', maxCount: 10 }     // Expect up to 10 files for photos
  ]), addPackage)
PackageRouter.get("/",getAllPackages)
PackageRouter.get("/:id",getParticularPackage)
PackageRouter.put("/:id",editPackage)
PackageRouter.delete("/:id",deletePackage)



export default PackageRouter