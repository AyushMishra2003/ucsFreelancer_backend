import axios from "axios";
import Booking from "../models/Booking/Booking.model.js";
const LOCATION_IQ_API_KEY = 'pk.2bc21e092c881e1b4035ef20f9da09f6'; // Replace with your LocationIQ API Key

// Fare calculation logic
const calculateFare = (distance) => {
  const baseFare = 50; // Fixed base fare in INR
  const farePerKm = 12; // Fare per kilometer
  const totalFare = baseFare + (distance * farePerKm);
  return totalFare.toFixed(2);  // Round to 2 decimal places
};

// Function to get latitude and longitude using LocationIQ
const getCoordinates = async (location) => {
  const response = await axios.get(`https://us1.locationiq.com/v1/search.php`, {
    params: {
      key: LOCATION_IQ_API_KEY,
      q: location,
      format: 'json',
      countrycodes: 'IN' // Restrict results to India
    }
  });

  if (response.data && response.data.length > 0) {
    const { lat, lon } = response.data[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
  } else {
    throw new Error('Location not found in India');
  }
};

// Function to calculate distance between two locations using latitude and longitude
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const addAirpotBooking = async (req, res, next) => {
  try {
    let {
      fromLocation, toLocation, tripType, category, bookingDate, bookingTime,
      pickupDate, pickupTime, name, email, phoneNumber, voucherCode,
      pickupAddress, dropAddress, paymentMode, isAirportDrop
    } = req.body;

    // Handle airport drop or pickup logic
    if (isAirportDrop === 1) {
      // If it's a drop to the airport
      toLocation = 'Airport';
      dropAddress = 'Airport'; // Define this based on your airport location
    } else if (isAirportDrop === 0) {
      // If it's a pickup from the airport
      fromLocation = 'Airport';
      pickupAddress = 'Airport'; // Define this based on your airport location
    }

    console.log(fromLocation, toLocation, isAirportDrop);

    // Ensure all required fields are present
    if (!fromLocation || !toLocation || !tripType || !category || !pickupDate || !pickupTime || !email || !pickupAddress || !dropAddress || !paymentMode) {
      return next(new AppError("All required fields must be provided", 400));
    }

    // Get coordinates for the locations
    const fromCoordinates = await getCoordinates(fromLocation);
    const toCoordinates = await getCoordinates(toLocation);

    // Calculate distance between the locations
    const distance = calculateDistance(
      fromCoordinates.lat, fromCoordinates.lon,
      toCoordinates.lat, toCoordinates.lon
    );

    // Calculate fare based on the distance
    const actualPrice = calculateFare(distance);

    // Add additional booking creation logic (similar to your existing flow)
    const booking = new Booking({
      fromLocation,
      toLocation,
      tripType,
      category,
      actualPrice,
      bookingDate,
      bookingTime,
      pickupDate,
      pickupTime,
      pickupAddress,
      dropAddress,
      paymentMode,
      status: "confirmed"
    });

    await booking.save();

    // Handle user creation or updating, sending emails, etc. (similar to your existing flow)

    return res.status(200).json({
      success: true,
      message: "Airport booking created successfully.",
      data: booking
    });

  } catch (error) {
    console.error(error);
    return next(new AppError("Something went wrong while creating the airport booking", 500));
  }
};



export {
    addAirpotBooking
}