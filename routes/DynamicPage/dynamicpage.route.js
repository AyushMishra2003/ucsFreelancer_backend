import { Router } from "express";
import {
  addChildrenToSection,
  createPage,
  createSection,
  getAllPages,
  getSectionsByPage,
  getSpecificSection,
} from "../../controllers/DynamicPage/Dynamic.controller.js";

const dynamicRoute = Router();

dynamicRoute.post("/page", createPage);
dynamicRoute.get("/", getAllPages);
dynamicRoute.post("/section", createSection);
dynamicRoute.post("/child/:id", addChildrenToSection);
dynamicRoute.get("/:pageName", getSectionsByPage);
dynamicRoute.post("/get/section",getSpecificSection);

export default dynamicRoute;
