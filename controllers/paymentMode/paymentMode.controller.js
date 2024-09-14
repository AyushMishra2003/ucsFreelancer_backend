import PaymentModel from "../../models/PaymentMode/PayementMode.model.js"
import AppError from "../../utilis/error.utlis.js"



const addPaymentMode=async(req,res,next)=>{
    try{
        const {mode1,mode2}=req.body        

        if(!mode1 || !mode2){
            return next(new AppError("payement mode Required field",400))
        }

        const paymentmode=await PaymentModel.create({
            mode1,
            mode2
        })

        if(!paymentmode){
            return next(new AppError("Payment Mode is Not Created",400))
        }

        res.status(200).json({
            success:true,
            message:"Payment Mode is Created",
            data:paymentmode
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const getPaymentMode=async(req,res,next)=>{
    try{

        const paymentMode=await PaymentModel.find({})

        if(!paymentMode){
            return next(new AppError("Payment Mode is Not Found",402))
        }

        res.status(200).json({
            success:true,
            message:"All Payement Mode",
            data:paymentMode
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const updatePaymentMode = async (req, res, next) => {
    try {
        const { id } = req.params;  // Assuming the payment mode ID is passed in the URL params
        const { mode1, mode2 } = req.body;

        if (!mode1 || !mode2) {
            return next(new AppError("Both payment modes (mode1 and mode2) are required", 400));
        }

        // Find and update the payment mode by ID
        const updatedPaymentMode = await PaymentModel.findByIdAndUpdate(
            id,
            { mode1, mode2 },
            { new: true, runValidators: true } // Return the updated document and run validations
        );

        if (!updatedPaymentMode) {
            return next(new AppError("Payment Mode not found or not updated", 404));
        }

        res.status(200).json({
            success: true,
            message: "Payment Mode updated successfully",
            data: updatedPaymentMode,
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


export {
    addPaymentMode,
    getPaymentMode,
    updatePaymentMode
}