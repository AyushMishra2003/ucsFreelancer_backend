
import { log } from 'console';
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

    // Validate cityName (since cityName is required in both cases)
    if (!cityName) {
      return next(new AppError("City name is required", 400));
    }

    // Check if the city already exists
    let airpotCityRate = await AirpotCityRate.findOne({ cityName });

    // If only cityName is provided, add a new city without rates
    if (!category && !kilometer && !rate && !extra) {
      if (airpotCityRate) {
        return next(new AppError("City already exists", 400));
      }

      // Create a new city with no rates
      airpotCityRate = new AirpotCityRate({
        cityName,
        rates: [],
      });

      await airpotCityRate.save();

      return res.status(200).json({
        success: true,
        message: "City added successfully",
        data: airpotCityRate,
      });
    }

    // Validate remaining fields for adding a rate
    if (!category || !kilometer || !rate || !extra) {
      return next(new AppError("All rate fields are required", 400));
    }

    // Check if the category exists
    const airpotcategory = await airpotCategory.findOne({ name: category });
    if (!airpotcategory) {
      return next(new AppError("Category not found", 400));
    }

    const categoryId = airpotcategory._id;

    // If the city exists, proceed to add/update rates
    if (airpotCityRate) {
      // Check if the category and kilometer already exist for the city
      const categoryExists = airpotCityRate.rates.some(
        (rateObj) =>
          rateObj.category.toString() === categoryId.toString() &&
          rateObj.kilometer === kilometer
      );

      if (categoryExists) {
        return next(
          new AppError(
            "Rate for this category and kilometer already exists for the city",
            400
          )
        );
      }

      // Add the new category, kilometer, rate, and extra to the existing city
      airpotCityRate.rates.push({
        category: categoryId,
        kilometer,
        rate,
        extra,
      });
    } else {
      // If city doesn't exist, create a new document with rates
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
       res.status(200).json({
        success:true,
        message:"Category List",
        data:[]
       })
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
    
    console.log("aggaggregated rates",aggregatedRates);
    
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


const updateAirportRate = async (req, res, next) => {
  try {

    console.log("ayush mishra");
    
    const { cityName, categoryId, kilometer,rate,extra } = req.body;


    console.log(req.body);
    

    // Validate input
    if (!cityName || !categoryId || !kilometer) {
      return next(new AppError("City name, category ID, and kilometer are required", 400));
    }

    // Find the airport city rate document
    const airportCityRate = await AirpotCityRate.findOne({ cityName });

    // If the city does not exist
    if (!airportCityRate) {
      return next(new AppError("City not found", 404));
    }

    // Find the index of the rate to update
    const rateIndex = airportCityRate.rates.findIndex(
      (rateObj) =>
        rateObj.category.toString() === categoryId.toString() &&
        rateObj.kilometer === kilometer
    );

    // If the rate does not exist
    if (rateIndex === -1) {
      return next(new AppError("Rate not found for this category and kilometer", 404));
    }

    // Update the rate logic (For demonstration, let's assume the rate increases by 10 for the new kilometer)
    airportCityRate.rates[rateIndex].rate = rate; // This is an example of updating the rate.
    airportCityRate.rates[rateIndex].kilometer = kilometer; // Assuming kilometer is updated too.
    airportCityRate.rates[rateIndex].extra=extra;

    // Save the updated document
    await airportCityRate.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Airport rate updated successfully",
      data: airportCityRate,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deleteAirportRate = async (req, res, next) => {
  try {
    const { cityName, categoryId, kilometer } = req.body;

    console.log(req.body);
    

    // Validate input
    if (!cityName || !categoryId || !kilometer) {
      return next(new AppError("City name, category ID, and kilometer are required", 400));
    }

    // Find the airport city rate document
    const airportCityRate = await AirpotCityRate.findOne({ cityName });

    // If the city does not exist
    if (!airportCityRate) {
      return next(new AppError("City not found", 404));
    }

    // Find the index of the rate to delete
    const rateIndex = airportCityRate.rates.findIndex(
      (rateObj) => 
        rateObj.category.toString() === categoryId.toString() &&
        rateObj.kilometer === kilometer
    );

    // If the rate does not exist
    if (rateIndex === -1) {
      return next(new AppError("Rate not found for this category and kilometer", 404));
    }

    // Remove the rate from the array
    airportCityRate.rates.splice(rateIndex, 1);

    // Save the updated document
    await airportCityRate.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Airport rate deleted successfully",
      data: airportCityRate,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};



const getAllAirpotCities = async (req, res, next) => {
  try {
    // Fetch all cities from the database and populate their rates and categories
    const allCities = await AirpotCityRate.find().populate({
      path: 'rates.category',
      model: 'UCS_Airpot_Category',
    });

    // If no cities are found, return an empty list
    if (!allCities || allCities.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No cities found",
        data: []
      });
    }

    // Aggregate rates by category for all cities
    const cityData = allCities.map(city => {
      const aggregatedRates = city.rates.reduce((acc, rate) => {
        const categoryId = rate.category._id.toString();
        const existingCategory = acc.find(cat => cat._id.toString() === categoryId);

        if (existingCategory) {
          // If the category already exists, push the rate to that category
          existingCategory.rates.push({
            kilometer: rate.kilometer,
            rate: rate.rate,
            extra: rate.extra,
          });
        } else {
          // If the category doesn't exist yet, create a new entry
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

      

      return {
        _id: city._id,
        cityName: city.cityName,
        rates: aggregatedRates,
        createdAt: city.createdAt,
        updatedAt: city.updatedAt,
      };
    });

    // Return the aggregated city and category rate data
    res.status(200).json({
      success: true,
      message: "City Category List retrieved successfully",
      data: cityData,
    });

  } catch (error) {
    console.log(error);
    
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

const editAirpotCategory = async (req, res, next) => {
  try {
      const { id } = req.params;
      const { name, numberOfSeats, acAvailable, numberOfBags } = req.body;

      // Find the existing category by ID
      const validCategory = await airpotCategory.findById(id);

      if (!validCategory) {
          return next(new AppError("Category not found", 404));
      }

      // Update the fields if they are provided in the request body
      if (name) {
          validCategory.name = name;
      }
      if (numberOfSeats) {
          validCategory.numberOfSeats = (numberOfSeats);
      }
      if (acAvailable) {
          validCategory.acAvailable = acAvailable === 'true' ? true : false; // Convert to boolean
      }
      if (numberOfBags) {
          validCategory.numberOfBags = (numberOfBags);
      }

      // Handle file upload if a new file is provided
      if (req.file) {
          console.log('File Upload:', req.file);
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: "lms",
          });
          if (result) {
              // Update the photo field with the new image
              validCategory.photo = {
                  public_id: result.public_id,
                  secure_url: result.secure_url
              };
          }

          // Remove the file from the server
          fs.unlinkSync(req.file.path); // Ensure correct file removal
      }

      // Save the updated category
      await validCategory.save();

      res.status(200).json({
          success: true,
          message: "Category updated successfully",
          data: validCategory
      });

  } catch (error) {
      return next(new AppError(error.message, 500));
  }
};


  

const deletAirpotCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the category exists
    const validCategory = await airpotCategory.findById(id);
    if (!validCategory) {
      return next(new AppError("Category is Not Valid", 400));
    }

    // Remove the category from all AirpotCityRate records
    await AirpotCityRate.updateMany(
      { 'rates.category': id }, // Find AirpotCityRate documents where the category matches the id
      { $pull: { rates: { category: id } } } // Remove the rates with the matching category
    );

    // Now delete the category itself
    await airpotCategory.findByIdAndDelete(id);

    // Send a success response
    res.status(200).json({
      success: true,
      message: "Airport Category deleted successfully, and its rates removed from relevant City Rates.",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};



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
    updateAirportRate,
    getAirpotCategory,
    getAirpotCity,
    getAllAirpotCities,
    deleteAirportRate

}