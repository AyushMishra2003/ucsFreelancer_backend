import Discount from "../../models/discount/discount.model.js";
import AppError from "../../utilis/error.utlis.js";

const addDiscount = async (req, res, next) => {
    try {
        const { tripType, discountType, discountValue, expiryDate, expiryTime, discountApplication ,discountLimit} = req.body;

        console.log(req.body);

        // Validate required fields
        if (!tripType || discountValue === undefined || discountType === undefined || discountApplication === undefined || !expiryDate || !expiryTime) {
            return next(new AppError("Required fields: tripType, discountValue, discountType, discountApplication, expiryDate, expiryTime", 400));
        }

        // Convert 12-hour time format to 24-hour time format
        const timePattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
        const match = expiryTime.match(timePattern);

        if (!match) {
            return next(new AppError("Invalid expiry time format. Use 12-hour format like '2:00 AM'.", 400));
        }

        let [hours, minutes, period] = match.slice(1);
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            return next(new AppError("Invalid expiry time values. Hours must be between 1 and 12, and minutes between 0 and 59.", 400));
        }

        // Convert 12-hour format to 24-hour format
        if (period.toUpperCase() === "PM" && hours !== 12) {
            hours += 12;
        } else if (period.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
        }

        // Construct the expiry date and time
        let expiry = new Date(`${expiryDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
        console.log("Constructed Expiry Date:", expiry);

        if (isNaN(expiry.getTime())) {
            return next(new AppError("Invalid expiry date or time.", 400));
        }

        // Get the current date and time
        const now = new Date();

        // Check if expiry is in the future
        if (expiry <= now) {
            return next(new AppError("The expiry date and time must be in the future.", 400));
        }

        // Check if a discount already exists for the given trip type
        let discount = await Discount.findOne({ tripType });

        if (discount) {
            return res.status(400).json({
                success: false,
                message: "Discount already exists for the selected trip type."
            });
        } else {
            // Create a new discount
            discount = await Discount.create({
                tripType,
                discountType,
                discountValue,
                expiryDate: expiry,
                expiryTime, // Store time as provided in 12-hour format
                discountApplication,
                discountLimit,
                active: true
            });

            return res.status(201).json({
                success: true,
                message: "Discount added successfully",
                data: discount
            });
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        return next(new AppError(error.message, 500));
    }
};

const changeStatus=async(req,res,next)=>{
    try{

        const {id}=req.params

        const discount=await Discount.findById(id)


        if(!discount){
            return next(new AppError("Discount not Find",404))
        }

        discount.active=!discount.active
        

        await discount.save()


        res.status(200).json({
            success:true,
            message:"Status Changed Succesfully",
            data:discount
        })



    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const getDiscount = async (req, res, next) => {
    try {
        console.log("Fetching all discounts");

        const allDiscounts = await Discount.find({});

        // Log the fetched discounts
        console.log(allDiscounts);

        if (allDiscounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No discounts found"
            });
        }

        res.status(200).json({
            success: true,
            message: "All discounts are fetched successfully",
            data: allDiscounts
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return next(new AppError(error.message, 500));
    }
};

const discount=async(req,res,next)=>{
    console.log("jaa kabutar");
    
    res.status(200).json({
        success:true,
        message:"ayush"
    })
}

const updateExpiryDate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { expiryDate } = req.body;

        if (!expiryDate) {
            return next(new AppError("Expiry date must be provided", 400));
        }

        // Convert expiryDate to Date object
        const expiry = new Date(expiryDate);

        const discount = await Discount.findById(id);

        if (!discount) {
            return next(new AppError("Discount not found", 404));
        }

        // Update the expiry date
        discount.expiryDate = expiry;
        await discount.save();

        res.status(200).json({
            success: true,
            message: "Expiry date updated successfully",
            data: discount
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return next(new AppError(error.message, 500));
    }
};

const updateDiscount = async (req, res, next) => {
    try {
        console.log("Updating discount...");

        const { id } = req.params; // Get the discount ID from the route parameters
        const { discountType, discountValue, expiryDate, expiryTime, discountApplication,discountLimit } = req.body;

        // Log the incoming request data
        console.log(req.body);

        // Validate that at least one field is provided for update
        if (discountType === undefined && discountValue === undefined && discountApplication === undefined && !expiryDate && !expiryTime) {
            return next(new AppError("At least one field is required for update", 400));
        }

        // Find the discount by ID
        const discount = await Discount.findById(id);

        if (!discount) {
            return next(new AppError("Discount not found", 404));
        }

        // Handle expiry date and time
        let expiry = discount.expiryDate; // Use the existing expiryDate if expiryDate and expiryTime are not provided

        if (expiryTime || expiryDate) {
            // Convert 12-hour time format to 24-hour time format if expiryTime is provided
            if (expiryTime) {
                const timePattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
                const match = expiryTime.match(timePattern);

                if (!match) {
                    return next(new AppError("Invalid expiry time format. Use 12-hour format like '2:00 AM'.", 400));
                }

                let [hours, minutes, period] = match.slice(1);
                hours = parseInt(hours, 10);
                minutes = parseInt(minutes, 10);

                if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
                    return next(new AppError("Invalid expiry time values. Hours must be between 1 and 12, and minutes between 0 and 59.", 400));
                }

                // Convert 12-hour format to 24-hour format
                if (period.toUpperCase() === "PM" && hours !== 12) {
                    hours += 12;
                } else if (period.toUpperCase() === "AM" && hours === 12) {
                    hours = 0;
                }

                // Construct the expiry date and time
                expiry = new Date(`${expiryDate || discount.expiryDate.toISOString().split('T')[0]}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
                console.log("Constructed Expiry Date:", expiry);

                if (isNaN(expiry.getTime())) {
                    return next(new AppError("Invalid expiry date or time.", 400));
                }
            } else if (expiryDate) {
                expiry = new Date(expiryDate);
            }

            // Get the current date and time
            const now = new Date();

            // Check if expiry is in the future
            if (expiry <= now) {
                return next(new AppError("The expiry date and time must be in the future.", 400));
            }
        }

        // Update the fields if they are provided
        if (discountType !== undefined) {
            discount.discountType = discountType;
        }
        if (discountValue !== undefined) {
            discount.discountValue = discountValue;
        }
        if (discountApplication !== undefined) {
            discount.discountApplication = discountApplication;
        }
        if (expiryDate || expiryTime) {
            discount.expiryDate = expiry; // Update expiryDate only if expiryDate or expiryTime is provided
        }
        if(discountLimit!==undefined){
            discount.discountLimit=discountLimit
        }

        discount.active = true;

        // Save the updated discount
        await discount.save();

        return res.status(200).json({
            success: true,
            message: "Discount updated successfully",
            data: discount
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return next(new AppError(error.message, 500));
    }
};

const fetchDiscount=async(req,res,next)=>{
    try{

        const {voucherCode}=req.body

        const discount=await Discount.find({voucherCode})

        if(!discount || discount.length===0){
            return next(new AppError("Discount not Found",400))
        }

        res.status(200).json({
            success:true,
            message:"Discount are:-",
            data:discount
        })


    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const deleteDiscount=async(req,res,next)=>{
    try{

        const {id}=req.params
        console.log("kya mai aaya");
        

        const discount=await Discount.findById(id)

        if(!discount){
            return next(new AppError("Discount not Found",400))
        }

        await Discount.findByIdAndDelete(id)

        res.status(200).json({
            success:true,
            message:"Discount Delete Succesfully"
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const validateDiscountCode = async (req, res, next) => {
    try {
        const { voucherCode,tripType } = req.body; // Assuming voucherCode is passed as a URL parameter



        if(!voucherCode || !tripType){
            return next(new AppError("All Field are Required",400))
        }

        // Find the discount using the voucher code
        const discount = await Discount.findOne({ voucherCode });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount code not found."
            });
        }

        console.log(discount);
        

        if(discount.tripType!=tripType && discount.discountApplication===2){
            res.status(200).json({
                success:true,
                message:"Discount Not valid",
                discount:0
            })
        }

        

        // Get the current date and time
        const now = new Date();

        // Check if the discount is active and has not expired
        if (!discount.active) {
            return res.status(400).json({
                success: false,
                message: "Discount code is not active.",
                discount:0
            });
        }

        // Combine expiry date and time for comparison
        const expiry = new Date(discount.expiryDate);
        const [hours, minutes] = discount.expiryTime.split(':').map(Number);
        expiry.setHours(hours);
        expiry.setMinutes(minutes);

        // Check if the discount has expired
        if (expiry <= now) {
            return res.status(400).json({
                success: false,
                message: "Discount code has expired.",
                data:0
            });
        }

        // Return the discount value
        return res.status(200).json({
            success: true,
            message: "Discount code is valid.",
            discount: discount.discountValue,
            dataType:discount.discountType
        });
    } catch (error) {
        console.error(error);
        return next(new AppError(error.message, 500));
    }
};


export {
    addDiscount,
    changeStatus,
    getDiscount,
    discount,
    updateExpiryDate,
    updateDiscount,
    fetchDiscount,
    deleteDiscount,
    validateDiscountCode
}