import cron from 'node-cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import ConnectionToDB from './config/dbConnection.js';
import Booking from './models/Booking/Booking.model.js';


dotenv.config();

// Function to update booking status
const updateBookingStatus = async () => {
    try {
      console.log('Starting booking status update...');
  
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
      }
  
      console.log('Booking statuses updated successfully.');
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
