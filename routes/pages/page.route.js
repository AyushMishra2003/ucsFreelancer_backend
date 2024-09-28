import { Router } from "express";
import { addHome, getHome } from "../../controllers/Pages/Home.js";

const PageRouter = Router();
PageRouter.post("/", addHome);
PageRouter.get("/", getHome);

export default PageRouter;
