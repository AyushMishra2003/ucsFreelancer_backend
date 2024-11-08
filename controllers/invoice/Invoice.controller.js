import PDFDocument from "pdfkit";
import AppError from "../../utilis/error.utlis.js";
import Booking from "../../models/Booking/Booking.model.js";
import User from "../../models/users/user.model.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateInvoice = async (req, res, next) => {
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const { id } = req.params;

    // Fetch booking details
    const booking = await Booking.findById(id);
    if (!booking) {
      return next(new AppError("Booking id not Found", 400));
    }

    const user = await User.findById(booking.userId);
    if (!user) {
      return next(new AppError("User not found", 400));
    }

    const logoPath = path.join(__dirname, "../../uploads/UCS LOGO.jpg");
    if (!fs.existsSync(logoPath)) {
      return next(new AppError("Logo file not found", 404));
    }

    // Set response headers and pipe to res
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // --- Add Invoice Content ---
    doc.image(logoPath, 50, 40, { width: 100, height: 100 });
    // Rest of the invoice content code as before...

    // End the document only once all content is added
    doc.end();

  } catch (error) {
    // Make sure `doc.end()` and `res` aren't already closed here
    if (!res.headersSent) {
      return next(new AppError(error.message, 500));
    }
  }
};


export default generateInvoice;
