import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from 'express'
import cors from 'cors'
import morgan from "morgan";
import errorMiddleware from "./middleware/error.middleware.js";
import { addUser } from "./controllers/UserController.js";
import userRouter from "./routes/users/users.routes.js";
import adminRoute from "./routes/admin/admin.route.js";
import cityRate from "./routes/Booking/CarRate.js";
import oneWayBookingRoute from "./routes/Booking/OneWayBooking.route.js";
import discountRoute from "./routes/discount/discount.route.js";
// import errorMiddleware from "./middlewares/error.middleware.js";
// import userRoutes from './routes/user.routes.js'
// import carsRoutes from './routes/cars.routes.js'
// import adminRoutes from './routes/admin.routes.js'
// import paymentRoutes from './routes/payment.routes.js'
// import boatRoutes from './routes/boat.routes.js'
// import priestRoutes from './routes/priest.routes.js'
// import guiderRoutes from './routes/guider.routes.js'
// import hotelRoutes from './routes/hotel.routes.js'

config()

const app = express()

app.use(express.urlencoded({ extended: true }))


app.use(express.json())

app.use(cookieParser())

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))

app.use(morgan('dev'))




// USERS ROUTER

app.use("/api/v1/user",userRouter)
app.use("/api/v1/admin",adminRoute)
app.use("/api/v1/city/rate",cityRate)
app.use("/api/v1/oneway/booking",oneWayBookingRoute)
app.use("/api/v1/discount",discountRoute)

// app.use('/api/v1/user', userRoutes)

// app.use('/api/v1/car', carsRoutes)

// app.use('/api/v1/admin', adminRoutes)

// app.use('/api/v1/payment', paymentRoutes)

// app.use('/api/v1/boat', boatRoutes)

// app.use('/api/v1/priest', priestRoutes)

// app.use('/api/v1/guider', guiderRoutes)

// app.use('/api/v1/hotel', hotelRoutes)

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

app.use(errorMiddleware)

export default app