import cron from 'node-cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import ConnectionToDB from './config/dbConnection.js';
import Booking from './models/Booking/Booking.model.js';
import sendEmail from './utilis/sendEmail.js';


dotenv.config();

// Function to update booking status
const updateBookingStatus = async () => {
  try {


    // Get current time in India Standard Time (IST)
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    console.log('Current IST Time:', indiaTime);

    // Find all confirmed bookings
    const bookings = await Booking.find({ status: 'confirmed' });

    for (const booking of bookings) {
      // Convert pickupTime ("02:43 AM") to 24-hour format and combine with pickupDate
      const [time, modifier] = booking.pickupTime.split(' ');
      let [hours, minutes] = time.split(':');

      // Convert to 24-hour format
      if (modifier === 'PM' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
      } else if (modifier === 'AM' && hours === '12') {
        hours = '00';
      }

      // Combine pickupDate and converted pickupTime into a single Date object
      const pickupDateTime = new Date(booking.pickupDate);
      pickupDateTime.setHours(hours, minutes, 0, 0); // Set hours and minutes

      // Compare pickupDateTime with current India time
      if (pickupDateTime < indiaTime) {
        await Booking.updateOne(
          { _id: booking._id },
          { $set: { status: 'ongoing' } }
        );
        console.log(`Updated booking ${booking._id} to "ongoing"`);
      }


      const bookingSubject = `Your Booking ${booking?.bookingId} is Now Ongoing`;

      const bookingMessage = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Dear <strong>${user?.name}</strong>,</p>

    <p>We are pleased to inform you that your booking with ID <strong>${booking?.bookingId}</strong> is now <strong>ongoing</strong> and your trip has started.</p>

    <h3>Trip Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr>
          <th style="padding: 10px; background-color: #f4f4f4; text-align: left;">Details</th>
          <th style="padding: 10px; background-color: #f4f4f4; text-align: left;">Information</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Pick-up Location</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking?.pickupAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Drop-off Location</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking?.dropAddress}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Pick-up Date & Time</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking?.pickupDate} at ${booking?.pickupTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Booking ID</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking?.bookingId}</td>
        </tr>
      </tbody>
    </table>

    <h3>Vehicle & Fare Details</h3>
    <p><strong>Car Type:</strong> ${booking?.category}</p>
    <p><strong>Total Amount Paid:</strong> ₹${booking?.totalPrice} (Including Service Tax)</p>

    <h3>Important Information</h3>
    <ul style="line-height: 1.6;">
      <li>Please keep your phone handy for any communication with the driver.</li>
      <li>If you have any questions or concerns during your trip, contact us at <a href="tel:+919520801801" style="color: #0066cc;">+91 95208 01801</a>.</li>
      <li>We wish you a safe and pleasant journey!</li>
    </ul>

    <p>If you need assistance, feel free to reach out via email at <a href="mailto:info@ucscab.com" style="color: #0066cc;">info@ucscab.com</a>.</p>

    <p>Thank you for choosing UCS Cabs.</p>

    <p>Best regards,<br>UCS Cabs Support Team</p>
  </div>
`;

    }



    await sendEmail(user.email, bookingSubject, bookingMessage);



  } catch (error) {
    console.error('Error updating booking statuses:', error);
  }
};



// Schedule the task to run every minute
cron.schedule('* * * * *', updateBookingStatus);

console.log('Status updater is running...');

// Connect to the database and start the cron job
const start = async () => {
  try {
    await ConnectionToDB(); // Connect to the database
    console.log('Database connection established.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

start();
