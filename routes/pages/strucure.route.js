import { Router } from "express";
import {
  addChildrenToSection,
  createSection,
  getSectionById,
  getSectionsByPage,
} from "../../controllers/Pages/Strucutre.js";

const strucutreRoute = Router();

strucutreRoute.post("/", createSection);
strucutreRoute.get("/:page", getSectionsByPage);
strucutreRoute.get("/:id", getSectionById);
strucutreRoute.post("/child/:id", addChildrenToSection);

export default strucutreRoute;
