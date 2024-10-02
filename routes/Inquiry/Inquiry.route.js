import { Router } from "express";
import {
  addInquiry,
  deleteAllInquiries,
  deleteInquiry,
  getInquiry,
} from "../../controllers/Inquiry/Inquiry.controller.js";

const inquiryRoute = Router();

inquiryRoute.post("/", addInquiry);
inquiryRoute.get("/", getInquiry);
inquiryRoute.delete("/:id", deleteInquiry);
inquiryRoute.delete("/delete/all", deleteAllInquiries);

export default inquiryRoute;
