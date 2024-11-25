import { Router } from "express";
import { addPackage, addPackageCategory, addPackageInclude, deletePackage, deletePackageCategory, deletePackageInclude, editPackage, editPackageCategory, editPackageInclude, getAllPackages, getPackageCategory, getPackageInclude, getParticularPackage } from "../../controllers/package/package.controller.js";
import upload from "../../middleware/multer.middlware.js";

const PackageRouter=Router()

PackageRouter.post("/", upload.fields([
    { name: 'mainPhoto', maxCount: 1 },  // Expect one file for mainPhoto
    { name: 'photos', maxCount: 10 }     // Expect up to 10 files for photos
  ]), addPackage)
PackageRouter.get("/",getAllPackages)
PackageRouter.get("/include",getPackageInclude)
PackageRouter.get("/category",getPackageCategory)
PackageRouter.get("/:id",getParticularPackage)
PackageRouter.put("/:id",editPackage)
PackageRouter.delete("/:id",deletePackage)

PackageRouter.post("/include",addPackageInclude)
PackageRouter.put("/include/:id",editPackageInclude)
PackageRouter.delete("/include/:id",deletePackageInclude)

PackageRouter.post("/category",upload.single("categoryPhoto"),addPackageCategory)
PackageRouter.put("/category/:id",upload.single("categoryPhoto"),editPackageCategory)
PackageRouter.delete("/category/:id",deletePackageCategory)







export default PackageRouter