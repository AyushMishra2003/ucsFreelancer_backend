import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from 'express';
import cors from 'cors';
import morgan from "morgan";
import errorMiddleware from "./middleware/error.middleware.js";
import userRouter from "./routes/users/users.routes.js";
import adminRoute from "./routes/admin/admin.route.js";
import cityRate from "./routes/Booking/CarRate.js";
import oneWayBookingRoute from "./routes/Booking/OneWayBooking.route.js";
import discountRoute from "./routes/discount/discount.route.js";
import localCategoryRoute from "./routes/local/local.route.js";
import chart from "./routes/chartrate.js";
import airpotRoute from "./routes/airpot/airpot.route.js";
import termRoute from "./routes/term.routes.js";
import PayementRouter from "./routes/payment/payment.route.js";
import { addRoundCategory } from "./controllers/Round/RoundCategory.js";
import multer from 'multer';
import roundRouter from "./routes/round/round.route.js";
import { getDistanceBetweenAirports } from "./controllers/Booking/OneWayBooking.controller.js";
import distanceRoute from "./routes/distanceRoute.js";

// Load environment variables
config();

// Initialize Express app
const app = express();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'https://ucscabdashboard.netlify.app'],
    credentials: true
}));
app.use(morgan('dev'));


// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/city/rate", cityRate);
app.use("/api/v1/oneway/booking", oneWayBookingRoute);
app.use("/api/v1/discount", discountRoute);
app.use("/api/v1/local", localCategoryRoute);
app.use("/api/v1/airpot", airpotRoute);
app.use("/api/v1/chart", chart);
app.use("/api/v1/tc", termRoute);
app.use("/api/v1/payment", PayementRouter);

// Route for adding round category with file upload
app.use("/api/v1/round",roundRouter);


app.use("/api/v1/distance",distanceRoute)

// Default route
app.get("/", (req, res) => {
    res.status(200).json({
      message: "Server is running and ready.",
    });
});
  
// Catch-all route for undefined endpoints
app.all("*", (req, res) => {
    res.status(404).json({
      success: false,
      status: 404,
      message: "Oops! Not Found",
    });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
