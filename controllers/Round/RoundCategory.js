import { log } from "util";
import roundCategoryModel from "../../models/Round/Round.category.model.js"
import AppError from "../../utilis/error.utlis.js"
import cloudinary from "cloudinary";
import fs from 'fs';
import RoundCityRate from "../../models/Round/Round.Rates.model.js";
import { Types } from "mongoose";


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
        const { id } = req.params; // Assume categoryId is passed as a URL parameter
        const { name, numberOfSeats, acAvailable, numberOfBags } = req.body;
        console.log(req.body);

        console.log("mai aaya hu");


        console.log(id);
        
        
        

        // Validate that categoryId is provided
        if (!id) {
            return next(new AppError("Category ID is required", 400));
        }

        // Validate input data
        if (!name && !numberOfSeats && !acAvailable && !numberOfBags && !req.file) {
            return next(new AppError("At least one field is required to update", 400));
        }

        // Find the existing category by ID
        let roundCategory = await roundCategoryModel.findById(id);
        if (!roundCategory) {
            return next(new AppError("Category not found", 404));
        }

        // Update fields if they are provided
        if (name) roundCategory.name = name;
        if (numberOfSeats) roundCategory.numberOfSeats = Number(numberOfSeats);
        if (acAvailable !== undefined) roundCategory.acAvailable = acAvailable === 'true';
        if (numberOfBags) roundCategory.numberOfBags = Number(numberOfBags);

        // Handle file upload if a new photo is provided
        if (req.file) {
            console.log("File Upload Process Started");

            // If there is an existing photo, remove it from Cloudinary
            if (roundCategory.photo && roundCategory.photo.public_id) {
                await cloudinary.v2.uploader.destroy(roundCategory.photo.public_id);
            }

            // Upload the new photo to Cloudinary
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
            });

            if (result) {
                // Update the photo details
                roundCategory.photo = {
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                };

                // Remove the uploaded file from the server
                fs.unlinkSync(req.file.path);
            } else {
                console.error("Cloudinary upload failed.");
                return next(new AppError("Failed to upload photo", 500));
            }
        }

        // Save the updated category
        await roundCategory.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Round Category updated successfully",
            data: roundCategory,
        });
    } catch (error) {
        console.error("Error in editRoundCategory:", error); // Log for debugging
        return next(new AppError(error.message, 500));
    }
};



const deleteRoundCategory = async (req, res, next) => {
    try {
        // Extract the category ID from the request parameters
        const { id } = req.params;

        console.log("mai aay ya nahi");
        

        // Find the round category by ID
        const roundCategory = await roundCategoryModel.findById(id);
        if (!roundCategory) {
            return next(new AppError("Round Category Not Found", 404));
        }

        console.log(roundCategory);
        

        // Find all cities that contain this category and remove the category from their rates array
        const updatedCities = await RoundCityRate.updateMany(
            { "rates.category": id }, // Filter: Find documents where the category is present in rates
            { $pull: { rates: { category: id } } } // Remove the rates with the matching category
        );


        // Log the updated cities for debugging
        console.log(`Updated Cities:`, updatedCities);

        // Delete the associated image from Cloudinary if it exists
        if (roundCategory.photo && roundCategory.photo.public_id) {
            await cloudinary.v2.uploader.destroy(roundCategory.photo.public_id);
        }

        // Finally, delete the round category itself
        await roundCategoryModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Round Category Deleted successfully, and references removed from cities"
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