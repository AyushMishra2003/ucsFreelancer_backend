import PDFDocument from "pdfkit";
import AppError from "../../utilis/error.utlis.js";
import Booking from "../../models/Booking/Booking.model.js";
import User from "../../models/users/user.model.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateInvoice = async (req, res, next) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const { id } = req.params;

  const booking = await Booking.findById(id);
  if (!booking) {
    return next(new AppError("Booking id not Found", 400));
  }

  const user = await User.findById(booking.userId);

  // Set the response content-type to PDF
  res.setHeader("Content-Type", "application/pdf");

  // Pipe the generated PDF to the response stream
  doc.pipe(res);

  // Header - Company Logo and Title
  const logoPath = path.join(
    __dirname,
    "../../uploads/1726325478292-aboutphoto1.png"
  );

  // Check if the logo file exists
  if (!fs.existsSync(logoPath)) {
    return next(new AppError("Logo file not found", 404));
  }

  // Logo
  doc.image(logoPath, 50, 30, { width: 100 }); // Company Logo

  // Invoice Title
  const invoiceTitle = "INVOICE";
  const titleWidth = doc.widthOfString(invoiceTitle);
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(invoiceTitle, doc.page.width - titleWidth - 50, 30); // Aligns with logo

  // Company Details
  doc
    .moveDown(2) // Space below title
    .fontSize(12)
    .font("Helvetica")
    .text("OPP HOTEL MAHALAXMI", 50)
    .text("SHIMLA BYPASS ROAD, DEHRADUN", 50)
    .text("+91 9520801801", 50)
    .text("sumit@ucscab.com", 50)
    .text("GST: 05AWKPK3799G2Z3", 50)
    .moveDown(1); // Space before billing section

  // Bill To and Invoice Details
  const startY = doc.y; // Capture the y position before the billing details
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Bill To:", 50, startY)
    .text(user.name, 50, startY + 15) // Customer Name
    .text(`Invoice No: ${booking._id}`, 350, startY)
    .text(`Date: ${new Date().toLocaleDateString()}`, 350, startY + 15)
    .text(`Taxi No: UK07 TB 9099`, 350, startY + 30)
    .moveDown(2); // Space before table

  // Table Header
  const tableTop = doc.y; // Current y position for the table
  const tableLeft = 50;

  // Draw Table Header
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Description", tableLeft, tableTop)
    .text("Price", tableLeft + 300, tableTop)
    .text("Amount", tableLeft + 400, tableTop)
    .moveTo(tableLeft, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Table Rows
  const tableRows = [
    {
      description: `${booking.fromLocation} - ${booking.pickupAddress} (${booking.tripType})`,
      price: `Rs ${booking.totalPrice}`,
      amount: `Rs ${booking.actualPrice}`,
    },
    {
      description: "IGST @5%",
      price: `Rs ${(booking.totalPrice * 0.05).toFixed(2)}`,
      amount: `Rs ${(booking.totalPrice * 0.05).toFixed(2)}`,
    },
    { description: "Total", price: "", amount: `Rs ${booking.actualPrice}` },
  ];

  // Dynamically draw rows and lines
  let y = tableTop + 25;
  tableRows.forEach((row, index) => {
    doc
      .font("Helvetica")
      .text(row.description, tableLeft, y, { width: 250, align: "left" }) // Ensure long descriptions wrap
      .text(row.price, tableLeft + 300, y)
      .text(row.amount, tableLeft + 400, y)
      .moveTo(tableLeft, y + 15)
      .lineTo(550, y + 15)
      .stroke();

    y += 20; // Adjust spacing between rows
  });

  // Move the y position to a new line before the total and payment details
  y += 20;

  // Total and Payment Details
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Total", 350, y)
    .text(`Rs. ${booking.totalPrice}`, 450, y)
    .text("Paid Amount", 350, y + 20)
    .text(`Rs. ${booking.totalPrice}`, 450, y + 20)
    .text("Balance Due", 350, y + 40)
    .text("Rs. 0", 450, y + 40);

  // Draw the line under the total and payment details
  doc
    .moveTo(50, y + 60)
    .lineTo(550, y + 60)
    .stroke();

  // Footer
  doc
    .fontSize(12)
    .font("Helvetica")
    .moveDown(2) // Space before footer
    .text("Thank you for your business with us.", 50, y + 80)
    .text(
      "This is an online generated receipt. No signature needed.",
      50,
      y + 100
    )
    .moveDown(1);

  // Finalize the PDF file and end the response
  doc.end();
};

// Export the function
export default generateInvoice;
