import Discount from "../../models/discount/discount.model.js";
import AppError from "../../utilis/error.utlis.js";

const addDiscount = async (req, res, next) => {
    try {
        const { tripType, discountType, discountValue, validityDays, expiryDate,discountApplication } = req.body;

        // Log the incoming request data
        console.log(req.body);

        // Validate required fields
        if (!tripType || discountValue === undefined || validityDays === undefined) {
            console.log(req.body);
            
            return next(new AppError("All fields are required", 400));
        }

        // Convert validityDays to integer
        const days = parseInt(validityDays, 10);
        if (isNaN(days) || days < 0) {
            return next(new AppError("Invalid number of validity days", 400));
        }

        // Determine the expiry date
        let expiry;
        if (expiryDate) {
            expiry = new Date(expiryDate);
        } else {
            expiry = new Date(); // Default to today's date if expiryDate is not provided
            if (days) {
                expiry.setDate(expiry.getDate() + days); // Add days to today if validityDays is provided
            }
        }

        // Check if a discount already exists for the given trip type
        let discount = await Discount.findOne({ tripType });

        if (discount) {
            // Update existing discount
            discount.discountType = discountType;
            discount.discountValue = discountValue;
            discount.expiryDate = expiry;
            discount.active = true; // Set active to true for updates
            discount.discountApplication=discountApplication
            await discount.save();

            return res.status(200).json({
                success: true,
                message: "Discount updated successfully",
                data: discount
            });
        } else {
            // Create a new discount
            console.log("mc",req.body);
            
            discount = await Discount.create({
                tripType,
                discountType,
                discountValue,
                expiryDate: expiry,
                discountApplication, 
                active: true // Set active to true by default
            });

            await discount.save()

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
        console.log("boom guys");
        
        const { id } = req.params; // Get the discount ID from the route parameters
        const { discountType, discountValue, expiryDate, discountApplication, validityDays } = req.body;

        // Log the incoming request data
        console.log(req.body);

        // Validate required fields
        if (!discountType && discountValue === undefined && !expiryDate && !discountApplication && validityDays === undefined) {
            return next(new AppError("At least one field is required for update", 400));
        }

        // Find the discount by ID
        const discount = await Discount.findById(id);

        if (!discount) {
            return next(new AppError("Discount not found", 404));
        }

        let expiry = discount.expiryDate; // Use the existing expiryDate if validityDays is not provided

        if (validityDays !== undefined) {
            const days = parseInt(validityDays, 10);
            if (isNaN(days) || days < 0) {
                return next(new AppError("Invalid number of validity days", 400));
            }

            expiry = new Date(); // Default to today's date if expiryDate is not provided
            expiry.setDate(expiry.getDate() + days); // Add days to today if validityDays is provided
        }

        // Update the fields if they are provided
        if (discountType !== undefined) {
            discount.discountType = discountType;
        }
        if (discountValue !== undefined) {
            discount.discountValue = discountValue;
        }
        if (expiryDate) {
            discount.expiryDate = new Date(expiryDate);
        } else if (validityDays !== undefined) {
            discount.expiryDate = expiry; // Update expiryDate only if validityDays is provided
        }
        if (discountApplication !== undefined) {
            discount.discountApplication = discountApplication;
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


export {
    addDiscount,
    changeStatus,
    getDiscount,
    discount,
    updateExpiryDate,
    updateDiscount
}