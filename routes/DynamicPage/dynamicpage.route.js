import { Router } from "express";
import {
  addChildrenToSection,
  createPage,
  createSection,
  getSectionsByPage,
} from "../../controllers/DynamicPage/Dynamic.controller.js";

const dynamicRoute = Router();

dynamicRoute.post("/page", createPage);
dynamicRoute.post("/section", createSection);
dynamicRoute.post("/section/child/:id", addChildrenToSection);
dynamicRoute.get("/:pageName", getSectionsByPage);

export default dynamicRoute;
