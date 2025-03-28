import { Router } from "express";
import { addPackage, addPackageCategory, addPackageInclude, addPackageTag, deletePackage, deletePackageCategory, deletePackageInclude, deletePackageTag, editPackage, editPackageCategory, editPackageInclude, editPackageTag, getAllPackages, getPackageByName, getPackageCategory, getPackageInclude, getPackageTag, getParticularPackage, updateAllPackages } from "../../controllers/package/package.controller.js";
import upload from "../../middleware/multer.middlware.js";

const PackageRouter=Router()

PackageRouter.post("/", upload.fields([
    { name: 'mainPhoto', maxCount: 1 }, 
    { name: 'photos', maxCount: 10 }    
  ]), addPackage)
PackageRouter.get("/",getAllPackages)
PackageRouter.get("/include",getPackageInclude)
PackageRouter.get("/category",getPackageCategory)
PackageRouter.get("/tag",getPackageTag)

PackageRouter.get("/:id",getParticularPackage)
PackageRouter.post("/byName",getPackageByName)
PackageRouter.put("/:id", upload.fields([
  { name: 'mainPhoto', maxCount: 1 }, 
  { name: 'photos', maxCount: 10 }    
]),editPackage)
PackageRouter.delete("/:id",deletePackage)

PackageRouter.post("/include",upload.single("includePhoto"),addPackageInclude)
PackageRouter.put("/include/:id",upload.single("includePhoto"),editPackageInclude)

PackageRouter.delete("/include/:id",deletePackageInclude)


PackageRouter.post("/category",upload.single("categoryPhoto"),addPackageCategory)
PackageRouter.put("/category/:id",upload.single("categoryPhoto"),editPackageCategory)
PackageRouter.delete("/category/:id",deletePackageCategory)




PackageRouter.post("/tag",addPackageTag)
PackageRouter.put("/tag/:id",editPackageTag)
PackageRouter.delete("/tag/:id",deletePackageTag)




PackageRouter.post("/update/all",updateAllPackages)






export default PackageRouter