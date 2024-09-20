
import airpotCategory from '../../models/Airpot/AirpotCategoryModel.js';
import AirpotCityRate from '../../models/Airpot/AirpotCityRate.model.js';

import AppError from '../../utilis/error.utlis.js'
import cloudinary from "cloudinary";
import fs from 'fs';

const addAirpotCategory=async(req,res,next)=>{
    try{

      
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

        console.log(req.file);
        

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
    const { cityName, category, kilometer, rate, extra } = req.body;

    // Validate required fields
    if (!cityName || !category || !kilometer || !rate || !extra) {
      return next(new AppError("All fields are required", 400));
    }

    // Check if the category exists
    const airpotcategory = await airpotCategory.findOne({ name: category });

    if (!airpotcategory) {
      return next(new AppError("Category not found", 400));
    }

    console.log(airpotcategory);
    

    const categoryId = airpotcategory._id;

    // Find if the city already exists
    let airpotCityRate = await AirpotCityRate.findOne({ cityName });

    if (airpotCityRate) {
      // Check if the category and kilometer already exist for the city
      const categoryExists = airpotCityRate.rates.some(
        (rateObj) =>
          rateObj.category.toString() === categoryId.toString() &&
          rateObj.kilometer === kilometer
      );

      if (categoryExists) {
        return next(new AppError("Rate for this category and kilometer already exists for the city", 400));
      }

      // Add the new category, kilometer, rate, and extra to the existing city
      airpotCityRate.rates.push({ category: categoryId, kilometer, rate, extra });
    } else {
      // If city doesn't exist, create a new document
      airpotCityRate = new AirpotCityRate({
        cityName,
        rates: [{ category: categoryId, kilometer, rate, extra }],
      });
    }

    // Save the updated or new document
    await airpotCityRate.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Airport rate added successfully",
      data: airpotCityRate,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


const getAirpotCity = async (req, res, next) => {
  try {
    let { cityName } = req.body;

    // Log the incoming request body for debugging
    console.log("Incoming cityName:", cityName);

    // Validate that cityName is provided
    if (!cityName) {
       res.status(200).json({
         success:true,
         message:"Category List",
         data:[]
       })
    }

    // Convert input to lowercase and trim whitespace
    cityName = cityName.toLowerCase().trim();

    // Find all cities in the database
    const allCities = await AirpotCityRate.find().populate({
      path: 'rates.category',
      model: 'UCS_Airpot_Category',
    });

    // Check if any city name in the database exists within the input string
    const matchedCity = allCities.find(city => 
      cityName.includes(city.cityName.toLowerCase())
    );

    // If no matching city is found
    if (!matchedCity) {
      return next(new AppError("City not found", 404));
    }

    // Aggregate rates by category
    const aggregatedRates = matchedCity.rates.reduce((acc, rate) => {
      const categoryId = rate.category._id.toString();
      const existingCategory = acc.find(cat => cat._id.toString() === categoryId);
      
      if (existingCategory) {
        existingCategory.rates.push({
          kilometer: rate.kilometer,
          rate: rate.rate,
          extra: rate.extra,
        });
      } else {
        acc.push({
          ...rate.category.toObject(),
          rates: [{
            kilometer: rate.kilometer,
            rate: rate.rate,
            extra: rate.extra,
          }],
        });
      }
      return acc;
    }, []);

    // Respond with the matched city and aggregated rate categories
    res.status(200).json({
      success: true,
      message: "City Category List retrieved successfully",
      data: {
        _id: matchedCity._id,
        cityName: matchedCity.cityName,
        rates: aggregatedRates,
        createdAt: matchedCity.createdAt,
        updatedAt: matchedCity.updatedAt,
      },
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
    getAirpotCategory,
    getAirpotCity

}