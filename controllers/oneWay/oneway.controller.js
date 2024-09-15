
import AppError from "../../utilis/error.utlis.js"
import cloudinary from "cloudinary";
import fs from 'fs';
import oneWayCategoryModel from "../../models/oneway/Category.model.js";


const addOneWayCategory=async(req,res,next)=>{
    try{

      
        const {name,numberOfSeats, acAvailable,numberOfBags}=req.body
        
        if(!name || !numberOfBags || !acAvailable || !numberOfSeats){
          return next(new AppError("All Field are Required",400))
        }

        const isAcAvailable = acAvailable === 'true'?true:false; // Adjust if 'true'/'false' strings are used

        const oneWaycategory=await oneWayCategoryModel.create({
           name,
           numberOfBags,
           acAvailable:isAcAvailable,
           numberOfSeats,
           photo:{
            public_id:"",
            secure_url:""
           }
        })

        

        if(!oneWaycategory){
            return next(new AppError("Airpot Category Not Created",402))
        }

        if (req.file) {
          console.log('File Upload:', req.file);
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: "lms",
          });
          if (result) {
              oneWaycategory.photo = {
                  public_id: result.public_id,
                  secure_url: result.secure_url
              };
              await oneWaycategory.save(); 
          }

          // Remove the file using fs.unlinkSync
          fs.unlinkSync(req.file.path); // Ensure correct file removal
      }

        await oneWaycategory.save()

        res.status(200).json({
            success:true,
            message:"New Category Added",
            data:oneWaycategory
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


const getOneWayCategory=async(req,res,next)=>{
    try{
         
        
        const alloneWayCategory=await oneWayCategoryModel.find({})

        if(!alloneWayCategory){
            return next(new AppError("One Wat Category Not Found",400))
        }

        res.status(200).json({
            success:true,
            message:"All Round Category",
            data:alloneWayCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const updateOneWayCategory = async (req, res, next) => {
    try {
        // Extract data from the request body
        const { id } = req.params; // Get the ID from the route parameters
        const { name, numberOfSeats, acAvailable, numberOfBags,p1 } = req.body;


        console.log(req.body);
        

        // Validate the data
        // if (!name || !numberOfSeats || !acAvailable || !numberOfBags) {
        //     return next(new AppError("All fields are required", 400));
        // }

        // Convert acAvailable to boolean if needed
        const isAcAvailable = acAvailable === 'true';

        // Find and update the round category
        const oneWayCategory = await oneWayCategoryModel.findByIdAndUpdate(
            id,
            { name, numberOfSeats, numberOfBags, acAvailable: isAcAvailable},
            { new: true, runValidators: true }
        );

        console.log(oneWayCategory);
        

        if (!oneWayCategory) {
            return next(new AppError("One Way Category Not Found", 404));
        }

        // Handle file upload if a new file is provided
        if (req.file) {
            console.log('File Upload:', req.file);
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
            });
            if (result) {
                oneWayCategory.photo = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                };
                await oneWayCategory.save(); // Save the round category with updated photo info
            }

            // Remove the file using fs.unlinkSync
            fs.unlinkSync(req.file.path); // Ensure correct file removal
        }

        res.status(200).json({
            success: true,
            message: "OneWay Category Updated successfully",
            data: oneWayCategory
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


const deleteOneWayCategory = async (req, res, next) => {
    try {
        // Extract the ID from the request parameters
        const { id } = req.params;

        // Find and delete the round category
        const oneWayCategory = await oneWayCategoryModel.findByIdAndDelete(id);

        if (!oneWayCategory) {
            return next(new AppError("OneWay Category Not Found", 404));
        }

        // Delete the associated image from Cloudinary if it exists
        if (oneWayCategory.photo && oneWayCategory.photo.public_id) {
            await cloudinary.v2.uploader.destroy(oneWayCategory.photo.public_id);
        }

        res.status(200).json({
            success: true,
            message: "OneWay Category Deleted successfully"
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};



export {
    addOneWayCategory,
    getOneWayCategory,
    updateOneWayCategory,
    deleteOneWayCategory
}