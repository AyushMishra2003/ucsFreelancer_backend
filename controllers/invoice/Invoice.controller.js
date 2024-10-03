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

    const booking = await Booking.findById(id);
    if (!booking) {
      return next(new AppError("Booking id not Found", 400));
    }

    const user = await User.findById(booking.userId);

    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // --- 1. Header ---
    // --- 1. Header ---
    const logoPath = path.join(__dirname, "../../uploads/UCS LOGO.jpg");

    if (!fs.existsSync(logoPath)) {
      return next(new AppError("Logo file not found", 404));
    }

    // Place the logo with increased dimensions
    const logoWidth = 100; // Adjust width as needed
    const logoHeight = 100; // Adjust height as needed
    doc.image(logoPath, 50, 40, { width: logoWidth, height: logoHeight });

    // Add gap after the image
    doc.moveDown(2); // Increase gap after logo
    // Title and "Customer Copy" (Aligned to the Right)
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("UCS CAB", 400, doc.y, { align: "right" }) // Use doc.y for the current position
      .fontSize(12)
      .text("Invoice", 400, doc.y + 40, { align: "right" }) // Space between title and invoice
      .font("Helvetica")
      .text("Customer Copy", 400, doc.y + 5, { align: "right" }); // Space after "Customer Copy"

    // --- 2. Company Information ---
    const companyInfoY = doc.y + 6; // Start after the last text element
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("OPP HOTEL MAHALAXMI", 50, companyInfoY)
      .text("SHIMLA BYPASS ROAD, DEHRADUN")
      .text("+91 9520801801")
      .text("sumit@ucscab.com")
      .text("GST: 05AWKPK3799G2Z3");

    // Horizontal Line (for Visual Separation)
    doc.moveDown(2); // Space before line
    doc
      .moveTo(50, companyInfoY + 60)
      .lineTo(550, companyInfoY + 60)
      .stroke(); // Adjusted line position

    // --- 3. Billing and Invoice Details ---
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To:", 50, companyInfoY + 70) // Adjusted position
      .font("Helvetica")
      .text(user.name, 50, companyInfoY + 85) // Adjusted position
      .font("Helvetica-Bold")
      .text("Invoice No:", 350, companyInfoY + 70) // Adjusted position
      .font("Helvetica")
      .text(booking._id, 350, companyInfoY + 85) // Adjusted position
      .font("Helvetica-Bold")
      .text("Date:", 350, companyInfoY + 100) // Adjusted position
      .font("Helvetica")
      .text(new Date().toLocaleDateString(), 350, companyInfoY + 115) // Adjusted position
      .font("Helvetica-Bold")
      .text("Taxi No:", 350, companyInfoY + 130) // Adjusted position
      .font("Helvetica")
      .text("UK07 TB 9099", 350, companyInfoY + 145); // Adjusted position

    // --- 4. Itemized Table ---
    const tableTop = companyInfoY + 180; // Starting Y position for the table
    const tableLeft = 50; // Starting X position for the table

    // Table Header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Description", tableLeft, tableTop)
      .text("Quantity", tableLeft + 250, tableTop)
      .text("Price", tableLeft + 300, tableTop)
      .text("Amount", tableLeft + 445, tableTop)
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table Rows
    const tableRows = [
      {
        description: `${booking.fromLocation} - ${booking.pickupAddress} (Taxi Type: ${booking.tripType})`,
        quantity: "1",
        price: `Rs. ${booking.totalPrice}`,
        amount: `Rs. ${booking.actualPrice}`,
      },
      {
        description: "IGST @18%",
        quantity: "",
        price: `Rs. ${(booking.totalPrice * 0.18).toFixed(2)}`,
        amount: `Rs. ${(booking.totalPrice * 0.18).toFixed(2)}`,
      },
    ];

    let y = tableTop + 25; // Start position for the rows
    tableRows.forEach((row) => {
      doc
        .font("Helvetica")
        .text(row.description, tableLeft, y, { width: 250, align: "left" })
        .text(row.quantity, tableLeft + 250, y, { width: 50, align: "right" })
        .text(row.amount, tableLeft + 400, y, { width: 100, align: "right" });

      // Draw horizontal line after the description row
      if (
        row.description.includes(
          `${booking.fromLocation} - ${booking.pickupAddress}`
        )
      ) {
        doc
          .moveTo(tableLeft, y + 27)
          .lineTo(550, y + 27)
          .stroke();
      }

      y += 32; // Adjust spacing between rows
    });

    // --- 5. Total and Payment Details ---
    // --- 5. Total and Payment Details ---
    // --- 5. Total and Payment Details ---
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total", 350, y)
      .text(`Rs. ${booking.totalPrice}`, 450, y, { width: 100, align: "right" })
      .text("Balance Due", 350, y + 20)
      .text("Rs. 0", 450, y + 20, { width: 100, align: "right" });

    // Horizontal Line (for Visual Separation)
    doc
      .moveTo(50, y + 60)
      .lineTo(550, y + 60)
      .stroke();

    // --- 6. Footer ---
    doc
      .fontSize(12)
      .font("Helvetica")
      .moveDown(2)
      .text("Thank you for your business with us.", 50, y + 80)
      .text(
        "This is an online generated receipt. No signature needed.",
        50,
        y + 100
      );

    // Finalize the PDF file and end the response
    doc.end();
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export default generateInvoice;
