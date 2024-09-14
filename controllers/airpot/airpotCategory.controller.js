
import airpotCategory from '../../models/Airpot/AirpotCategoryModel.js'
import AirpotRateModel from '../../models/Airpot/AirpotRate.js'
import AppError from '../../utilis/error.utlis.js'
import cloudinary from "cloudinary";
import fs from 'fs';

const addAirpotCategory=async(req,res,next)=>{
    try{

      console.log("ayuus mishra");
      
        const {name,numberOfSeats, acAvailable,numberOfBags}=req.body
        
        if(!name || !numberOfBags || !acAvailable || !numberOfSeats){
          return next(new AppError("All Field are Required",400))
        }

        const isAcAvailable = acAvailable === 'true'?true:false; // Adjust if 'true'/'false' strings are used

        const airpotcategory=await airpotCategory.create({
           name,
           numberOfBags,
           acAvailable:isAcAvailable,
           numberOfSeats,
           photo:{
            public_id:"",
            secure_url:""
           }
        })

        console.log(airpotcategory);
        

        if(!airpotcategory){
            return next(new AppError("Airpot Category Not Created",402))
        }

        if (req.file) {
          console.log('File Upload:', req.file);
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: "lms",
          });
          if (result) {
              airpotcategory.photo = {
                  public_id: result.public_id,
                  secure_url: result.secure_url
              };
              await airpotcategory.save(); 
          }

          // Remove the file using fs.unlinkSync
          fs.unlinkSync(req.file.path); // Ensure correct file removal
      }

        await airpotcategory.save()

        res.status(200).json({
            success:true,
            message:"New Category Added",
            data:airpotcategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const addAirpotRate = async (req, res, next) => {
    try {
      const { kilometer, rate, extra } = req.body;
      const { id } = req.params;

      console.log(kilometer);
      
  
      // Find the airport category by its ID
      const validAirpot = await airpotCategory.findById(id);
  
      if (!validAirpot) {
        return next(new AppError("Airport Category is not valid", 400));
      }
  
      // Check if the provided kilometer is within the allowed values
      if (!["30", "40", "55", "70"].includes(kilometer)) {
        return next(new AppError("Kilometer value is not valid", 400));
      }
  
      // Check if a rate already exists for the same kilometer
      const existingRate = validAirpot.rates.find((r) => r.kilometer === kilometer);
      if (existingRate) {
        return next(new AppError(`Rate for ${kilometer}km already exists`, 400));
      }
  
      // Add the new rate to the rates array
      validAirpot.rates.push({
        kilometer,
        rate,
        extra,
      });
  
      // Save the updated document
      await validAirpot.save();
  
      res.status(200).json({
        success: true,
        message: "Airport rate successfully added",
        data: validAirpot,
      });
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
};
  
const getByAirpotCategory=async(req,res,next)=>{
    try{

        const allCategory=await airpotCategory.find({})

        if(!allCategory){
            return next(new AppError("Category Not  Found",400))
        }

        res.status(200).json({
            success:true,
            message:"ALL Airpot Category are:-",
            data:allCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const editAirpotCategory=async(req,res,next)=>{
    try{

        console.log("mai aa raha hu bhai");
        
        const {id}=req.params

        const {name,description}=req.body
        
        const validCategory=await airpotCategory.findById(id)

        if(!validCategory){
            return next(new AppError("Category is Not Valid",400))
        }

        if(name){
            validCategory.name=name
        }
        if(description){
            validCategory.description=description
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


const updateAirpotRate = async (req, res, next) => {
    try {
      const { kilometer, rate, extra } = req.body;
      const { id } = req.params;
  
      // Find the airport category by its ID
      const validAirpot = await AirpotRateModel.findById(id);
  
      if (!validAirpot) {
        return next(new AppError("Airport Category is not valid", 400));
      }
  
      // Check if the provided kilometer is within the allowed values
      if (!["30", "45", "50", "70"].includes(kilometer)) {
        return next(new AppError("Kilometer value is not valid", 400));
      }
  
      // Find the rate object to update
      const existingRate = validAirpot.rates.find((r) => r.kilometer === kilometer);
  
      if (!existingRate) {
        return next(new AppError(`Rate for ${kilometer}km does not exist`, 400));
      }
  
      // Update the rate and extra fields
      existingRate.rate = rate !== undefined ? rate : existingRate.rate;
      existingRate.extra = extra !== undefined ? extra : existingRate.extra;
  
      // Save the updated document
      await validAirpot.save();
  
      res.status(200).json({
        success: true,
        message: "Airport rate successfully updated",
        data: validAirpot,
      });
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
};
  

const deletAirpotCategory=async(req,res,next)=>{
    try{

        const {id}=req.params

        const validCategory=await AirpotRateModel.findById(id)

        if(!validCategory){
            return next(new AppError("Category is Not Valid",400))
        }


        await AirpotRateModel.findByIdAndDelete(id)

        res.status(200).json({
            success:true,
            message:"Airpot Categorty Delete Succesfully"
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const getAirpotCategory=async(req,res,next)=>{
  try{

    const allCategory=await airpotCategory.find({})

    res.status(200).json({
      success:true,
      message:"All Category",
      data:allCategory
    }
    )

  }catch(error){
    return next(new AppError(error.message,500))
  }
}

export {
    addAirpotCategory,
    getByAirpotCategory,
    editAirpotCategory,
    deletAirpotCategory,
    addAirpotRate,
    updateAirpotRate,
    getAirpotCategory

}