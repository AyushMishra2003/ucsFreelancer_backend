import PDFDocument from "pdfkit";
import AppError from "../../utilis/error.utlis.js";
import Booking from "../../models/Booking/Booking.model.js";
import User from "../../models/users/user.model.js";



const generateInvoice = async(req, res,next) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const {id}=req.params

  const booking=await Booking.findById(id)

  if(!booking){
    return next(new AppError("Booking id not Found",400))
  }

  console.log(booking);
   
  const user=await User.findById(booking.userId)

  console.log(user);
  

  // Set the response content-type to PDF
  res.setHeader("Content-Type", "application/pdf");

  // Pipe the generated PDF to the response stream
  doc.pipe(res);

  // Header - Company Details
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("OPP HOTEL MAHALAXMI", 50, 50)
    .text("SHIMLA BYPASS ROAD, DEHRADUN", 50)
    .text("+91 9520801801", 50)
    .text("sumit@ucscab.com", 50)
    .moveDown(1)
    .text("GST: 05AWKPK3799G2Z3", 50);

  // UCS CAB Title centered on the page
  const pageWidth = doc.page.width;
  const ucsCabTitle = "UCS CAB";
  const ucsCabTextWidth = doc.widthOfString(ucsCabTitle);
  const centerX = (pageWidth - ucsCabTextWidth) / 2;

  // UCS CAB Title and Invoice Title
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(ucsCabTitle, centerX, 120) // UCS CAB centered
    .moveDown(3); // Space after UCS CAB

  // Bill To and Invoice Details
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Bill To:", 50, 180)
    .text(`${user.name}`, 50, 195)
    .moveDown(1)
    .text(`Invoice no: 202301090090`, 350, 180)
    .text("Date: 09/01/2023", 350, 195)
    .text(`Taxi No: UK07 TB 9099`, 350, 210);

  // Table Header with lines
  const tableTop = 250;
  const tableLeft = 50;

  // Draw Table Header lines
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Description", tableLeft, tableTop)
    .text("Quantity", tableLeft + 200, tableTop)
    .text("Price", tableLeft + 300, tableTop)
    .text("Amount", tableLeft + 400, tableTop);

  doc.moveTo(tableLeft, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Table Rows with lines
  const tableRows = [
    { description: `${booking?.fromLocation} - ${booking?. pickupAddress} : ${booking?.tripType})`, quantity: 1, price: `Rs ${booking?. totalPrice}`, amount: `Rs ${booking?. actualPrice}` },
    { description: "IGST @18%", quantity: "", price: "Rs 1080", amount: "Rs 1080" },
    { description: "Total", quantity: "", price: "", amount: `Rs ${booking?. actualPrice}` },
  ];

  // Dynamically draw rows and lines
  let y = tableTop + 25;
  tableRows.forEach(row => {
    doc
      .font("Helvetica")
      .text(row.description, tableLeft, y)
      .text(row.quantity, tableLeft + 200, y)
      .text(row.price, tableLeft + 300, y)
      .text(row.amount, tableLeft + 400, y);

    doc.moveTo(tableLeft, y + 15)
      .lineTo(550, y + 15)
      .stroke();

    y += 20;
  });

  // Move the y position to a new line before the total and payment details
  y += 20;

  // Total and Payment Details
  const totalAmountY = y;
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Total", 350, totalAmountY)
    .text("Rs. 7080", 450, totalAmountY)
    .text("Paid Amount", 350, totalAmountY + 20)
    .text("Rs. 7080", 450, totalAmountY + 20)
    .text("Balance Due", 350, totalAmountY + 40)
    .text("Rs. 0", 450, totalAmountY + 40);

  // Draw the line under the total and payment details
  doc.moveTo(50, totalAmountY + 60)
    .lineTo(550, totalAmountY + 60)
    .stroke();

  // Footer
  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Thank you for your business with us.", 50, totalAmountY + 80)
    .text("This is an online generated receipt. No signature needed.", 50, totalAmountY + 100)
    .moveDown(1);

  // Finalize the PDF file and end the response
  doc.end();
};

export default generateInvoice;
