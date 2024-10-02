import { Router } from "express";
import {
  addVendor,
  deleteVendor,
  editVendor,
  getVendor,
} from "../../controllers/Vendor/Vendor.controller.js";

const vendorRoute = Router();

vendorRoute.post("/", addVendor);
vendorRoute.get("/", getVendor);
vendorRoute.put("/:id", editVendor);
vendorRoute.delete("/:id", deleteVendor);

export default vendorRoute;
