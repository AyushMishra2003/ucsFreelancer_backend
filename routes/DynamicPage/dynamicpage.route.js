import { Router } from "express";
import {
  addChildrenToSection,
  createPage,
  createSection,
  getAllPages,
  getSectionsByPage,
  getSpecificSection,
} from "../../controllers/DynamicPage/Dynamic.controller.js";
import upload from "../../middleware/multer.middlware.js";

const dynamicRoute = Router();

dynamicRoute.post("/page", createPage);
dynamicRoute.get("/", getAllPages);
dynamicRoute.post("/section", upload.single("photo"), createSection);
dynamicRoute.post("/child/:id", upload.single("photo"), addChildrenToSection);
dynamicRoute.get("/:pageName", getSectionsByPage);
dynamicRoute.post("/get/section", getSpecificSection);

export default dynamicRoute;
