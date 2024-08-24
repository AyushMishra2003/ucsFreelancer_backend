import { model, Schema } from "mongoose";


const carSchema = new Schema({
    make: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    ratePerKm: {
        type: Number,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Available', 'Unavailable'],
        default: 'Available',
    }
}, { timestamps: true });


const CarModel=model("UcsCab_Cars",carSchema)



export default CarModel
