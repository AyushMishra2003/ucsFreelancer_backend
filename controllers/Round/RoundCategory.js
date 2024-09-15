import roundCategoryModel from "../../models/Round/Round.category.model.js"
import AppError from "../../utilis/error.utlis.js"
import cloudinary from "cloudinary";
import fs from 'fs';


const addRoundCategory = async (req, res, next) => {
    try {
        console.log("jai hp");

        const { name, numberOfSeats, acAvailable, numberOfBags } = req.body;
        console.log(req.body); // Debugging purpose

        // Validate the data
        if (!name || !numberOfSeats || !acAvailable || !numberOfBags ) {
            return next(new AppError("All fields are required", 400));
        }

        // Convert acAvailable to boolean
        const isAcAvailable = acAvailable === 'true'?true:false; // Adjust if 'true'/'false' strings are used
        const seats = Number(numberOfSeats);
        const bags = Number(numberOfBags);

        // Create a new round category with an empty photo object initially
        const roundCategory = await roundCategoryModel.create({
            name,
            numberOfBags: bags,
            numberOfSeats: seats,
            acAvailable: isAcAvailable,
            photo:{
                public_id:"",
                secure_url:""
            }
        });

        console.log(req.file);
        

        if (!roundCategory) {
            return next(new AppError("Round Category Not Created", 402));
        }

        // Handle file upload if the file is present
        if (req.file) {
            console.log("File Upload Process Started");
            console.log('File Details:', req.file); // Debugging log to ensure file info is correct

            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
            });

            if (result) {
                // Log the Cloudinary result for debugging
                console.log('Cloudinary Upload Result:', result);

                // Update the round category with Cloudinary photo info
                roundCategory.photo = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                };

                // Save the updated round category with the photo details
                await roundCategory.save();

                // Remove the uploaded file from the server
                fs.unlinkSync(req.file.path); // Ensure correct file removal
            } else {
                console.error("Cloudinary upload failed.");
                return next(new AppError("Failed to upload photo", 500));
            }
        }


        await roundCategory.save()

        res.status(200).json({
            success: true,
            message: "Round Category Added successfully",
            data: roundCategory
        });

    } catch (error) {
        console.error("Error in addRoundCategory:", error); // Additional logging for debugging
        return next(new AppError(error.message, 500));
    }
};


const addRoundRate=async(req,res,next)=>{
    try{

        const { perKm,extraKm}=req.body

        const {id}=req.params

        if(!perKm || !extraKm){
            return next(new AppError("All Field are Required",400))
        }

        const validRound=await roundCategoryModel.findById(id)

        if(!validRound){
            return next(new AppError("Round Category Not Found",400))
        }

        validRound.perKm=perKm
        validRound.extraKm=extraKm


        await validRound.save()

        res.status(200).json({
            success:true,
            message:"Rate Added Succesfully",
            data:validRound
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

// const addRoundCityName=async(req,res,next)=>{
//     try{

//     }catch(error){
//         retu
//     }
// }


const getRoundCategory=async(req,res,next)=>{
    try{
         
        console.log("ayushmishr");
        
        const allRoundCategory=await roundCategoryModel.find({})

        if(!allRoundCategory){
            return next(new AppError("Round Category Not Found",400))
        }

        res.status(200).json({
            success:true,
            message:"All Round Category",
            data:allRoundCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const updateRoundCategory = async (req, res, next) => {
    try {
        // Extract data from the request body
        const { id } = req.params; // Get the ID from the route parameters
        const { name, numberOfSeats, acAvailable, numberOfBags,perKm,extraKm } = req.body;

        // Validate the data
        // if (!name || !numberOfSeats || !acAvailable || !numberOfBags) {
        //     return next(new AppError("All fields are required", 400));
        // }

        // Convert acAvailable to boolean if needed
        const isAcAvailable = acAvailable === 'true';

        // Convert numberOfSeats and numberOfBags to numbers
        const seats = Number(numberOfSeats);
        const bags = Number(numberOfBags);

        // Find and update the round category
        const roundCategory = await roundCategoryModel.findByIdAndUpdate(
            id,
            { name, numberOfSeats: seats, numberOfBags: bags, acAvailable: isAcAvailable,perKm,extraKm },
            { new: true, runValidators: true }
        );

        if (!roundCategory) {
            return next(new AppError("Round Category Not Found", 404));
        }

        // Handle file upload if a new file is provided
        if (req.file) {
            console.log('File Upload:', req.file);
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
            });
            if (result) {
                roundCategory.photo = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                };
                await roundCategory.save(); // Save the round category with updated photo info
            }

            // Remove the file using fs.unlinkSync
            fs.unlinkSync(req.file.path); // Ensure correct file removal
        }

        res.status(200).json({
            success: true,
            message: "Round Category Updated successfully",
            data: roundCategory
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


const deleteRoundCategory = async (req, res, next) => {
    try {
        // Extract the ID from the request parameters
        const { id } = req.params;

        // Find and delete the round category
        const roundCategory = await roundCategoryModel.findByIdAndDelete(id);

        if (!roundCategory) {
            return next(new AppError("Round Category Not Found", 404));
        }

        // Delete the associated image from Cloudinary if it exists
        if (roundCategory.photo && roundCategory.photo.public_id) {
            await cloudinary.v2.uploader.destroy(roundCategory.photo.public_id);
        }

        res.status(200).json({
            success: true,
            message: "Round Category Deleted successfully"
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};



export {
    addRoundCategory,
    getRoundCategory,
    updateRoundCategory,
    deleteRoundCategory,
    addRoundRate
}