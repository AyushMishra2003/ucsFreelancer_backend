import LocalCategoryModel from "../../models/Local/LocalCategoryModel.js";
import LocalCityRate from "../../models/Local/LocalCityRateModel.js";
import AppError from '../../utilis/error.utlis.js'
import cloudinary from "cloudinary";
import fs from 'fs';

const addLocalCategory=async(req,res,next)=>{
    try{

        const {name,numberOfSeats, acAvailable,numberOfBags}=req.body
        
        if(!name || !numberOfBags || !acAvailable || !numberOfSeats){
          return next(new AppError("All Field are Required",400))
        }

        const isAcAvailable = acAvailable === 'true'?true:false; // Adjust if 'true'/'false' strings are used

        const localcategory=await LocalCategoryModel.create({
           name,
           numberOfBags,
           acAvailable:isAcAvailable,
           numberOfSeats,
           photo:{
            public_id:"",
            secure_url:""
           }
        })

        

        if(!localcategory){
            return next(new AppError("Not Category  Created",402))
        }

        if (req.file) {
          console.log('File Upload:', req.file);
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: "lms",
          });
          if (result) {
              localcategory.photo = {
                  public_id: result.public_id,
                  secure_url: result.secure_url
              };
              await localcategory.save(); 
          }

          // Remove the file using fs.unlinkSync
          fs.unlinkSync(req.file.path); // Ensure correct file removal
      }

        await localcategory.save()

        res.status(200).json({
            success:true,
            message:"New Category Added",
            data:localcategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const getByLocationCategory=async(req,res,next)=>{
    try{

        const allCategory=await LocalCategoryModel.find({})

        if(!allCategory){
            return next(new AppError("Category Not  Found",400))
        }

        res.status(200).json({
            success:true,
            message:"ALL Local Category are:-",
            data:allCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const editLocalCategory=async(req,res,next)=>{
    try{

        console.log("mai aa raha hu bhai");
        
        const {id}=req.params

        const {name,numberOfSeats, acAvailable,numberOfBags}=req.body
        
        const validCategory=await LocalCategoryModel.findById(id)

        if(!validCategory){
            return next(new AppError("Category is Not Valid",400))
        }

        if(name){
            validCategory.name=name
        }
        if(numberOfSeats){
            validCategory.numberOfSeats=numberOfSeats
        }
        if(acAvailable){
            validCategory.acAvailable=acAvailable
        }
        if(numberOfBags){
            validCategory.numberOfBags=numberOfBags
        }

        if (req.file) {
            console.log('File Upload:', req.file);
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
            });
            if (result) {
                validCategory.photo = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                };
                await validCategory.save(); 
            }
  
            // Remove the file using fs.unlinkSync
            fs.unlinkSync(req.file.path); // Ensure correct file removal
        }
  

        await validCategory.save()

        res.status(200).json({
            success:true,
            message:"Local Category Edit Succesfully",
            data:validCategory
        })


    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const deletLocalCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if the category exists
        const validCategory = await LocalCategoryModel.findById(id);
        if (!validCategory) {
            return next(new AppError("Category is Not Valid", 400));
        }

        // Remove the category from all LocalCityRate records
        await LocalCityRate.updateMany(
            { 'rates.category': id }, // Find LocalCityRate documents where the category matches the id
            { $pull: { rates: { category: id } } } // Remove the rates with the matching category
        );

        // Now delete the category itself
        await LocalCategoryModel.findByIdAndDelete(id);

        // Send a success response
        res.status(200).json({
            success: true,
            message: "Local Category deleted successfully, and its rates removed from relevant City Rates.",
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};






async function updateExistingCategories() {
    try {
      // Find categories missing the new fields and update them
      const categories = await LocalCategoryModel.find({});
  
      categories.forEach(async (category) => {
        if (!category.numberOfSeats) category.numberOfSeats = 0; // Default value
        if (category.acAvailable === undefined) category.acAvailable = false; // Default value
        if (!category.numberOfBags) category.numberOfBags = 0; // Default value
  
        // Save updated category
        await category.save();
      });
  
      console.log('Existing categories updated');
    } catch (err) {
      console.error('Error updating existing categories:', err);
    }
}
  



export {
    addLocalCategory,
    getByLocationCategory,
    editLocalCategory,
    deletLocalCategory
}