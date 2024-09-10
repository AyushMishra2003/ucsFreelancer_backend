import LocalCityRate from "../../models/Local/LocalCityRateModel.js";
import LocalCategoryModel from "../../models/Local/LocalCategoryModel.js";
import AppError from "../../utilis/error.utlis.js";
import mongoose from "mongoose";

const addRate = async (req, res, next) => {
    try {
        const { cityName, category, perKm, perHour, rateFor80Km8Hours, rateFor100Km8Hours } = req.body;

        // Validate input
        if (!cityName || !category || !perKm || !perHour || !rateFor80Km8Hours || !rateFor100Km8Hours) {
            return next(new AppError("All fields are required", 400));
        }

        // Find the category ObjectId by name
        const categoryDoc = await LocalCategoryModel.findOne({ name: category });

        if (!categoryDoc) {
            return next(new AppError("Category not found", 400));
        }

        const categoryId = categoryDoc._id;

        // Find the existing city rate document
        let cityRate = await LocalCityRate.findOne({ cityName });

        if (cityRate) {
            // Check if the category already exists in the rates array
            const categoryExists = cityRate.rates.some(
                (rateObj) => rateObj.category.toString() === categoryId.toString()
            );

            if (categoryExists) {
                return next(new AppError("Rate for this category already exists for the given city", 400));
            }

            // Add the new category and rate to the existing document
            cityRate.rates.push({ category: categoryId, perKm, perHour, rateFor80Km8Hours, rateFor100Km8Hours });
        } else {
            // Create a new document for the city
            cityRate = await LocalCityRate.create({
                cityName,
                rates: [{ category: categoryId, perKm, perHour, rateFor80Km8Hours, rateFor100Km8Hours }],
            });
        }

        // Save the updated or new document
        await cityRate.save();

        res.status(200).json({
            success: true,
            message: "Rate is added successfully",
            data: cityRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const getRate = async (req, res, next) => {
    try {
        const allCityRate = await LocalCityRate.find({}).populate('rates.category');
        const allCategory=await LocalCategoryModel.find({})

        if (!allCityRate) {
            return next(new AppError("Rate Not Found", 400));
        }

        res.status(200).json({
            success: true,
            message: "All City Rates",
            data: {
                allCityRate,
                allCategory
            },
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const getByLocation = async (req, res, next) => {
    try {
        const { cityName } = req.body;

        if (!cityName) {
            return next(new AppError("City is Required", 400));
        }
        const cityRate = await LocalCityRate.findOne({ cityName })
            .populate({
                path: 'rates.category', // Populate category field within rates
                select: 'name' // Include fields from the category, adjust as needed
            });

        if (!cityRate) {
            return next(new AppError("City Rate Not Found", 404));
        }

        // Format the response data
        const formattedRates = cityRate.rates.map(rate => ({
            category: rate.category ? rate.category.name : 'Unknown Category', // Adjust if `name` is not the field
            rate: {
                perKm: rate.perKm,
                perHour: rate.perHour,
                rateFor80Km8Hours: rate.rateFor80Km8Hours,
                rateFor100Km8Hours: rate.rateFor100Km8Hours
            }
        }));

        console.log(formattedRates);
        
        

        res.status(200).json({
            success: true,
            message: "City Rate:",
            data: formattedRates,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const updateLocalRate = async (req, res, next) => {
    try {
        console.log("Request body:", req.body);

        const { cityName, category, perKm, perHour, rateFor80Km8Hours, rateFor100Km8Hours } = req.body;

        // Validate that cityName and category are provided
        if (!cityName || !category) {
            return next(new AppError("cityName and category are required", 400));
        }

        // Find the category ObjectId by name
        const categoryDoc = await LocalCategoryModel.findOne({ name: category });

        if (!categoryDoc) {
            return next(new AppError("Category not found", 400));
        }

        const categoryId = categoryDoc._id;

        // Find the city rate object based on cityName
        const cityRate = await LocalCityRate.findOne({ cityName });

        if (!cityRate) {
            return next(new AppError("No rate found for the given city", 404));
        }

        // Find the specific rate by category in the rates array
        const rateIndex = cityRate.rates.findIndex(
            (rateObj) => rateObj.category.toString() === categoryId.toString()
        );

        if (rateIndex === -1) {
            return next(new AppError("No category found for the given city", 404));
        }

        // Update the rate values if they are provided
        if (perKm) cityRate.rates[rateIndex].perKm = perKm;
        if (perHour) cityRate.rates[rateIndex].perHour = perHour;
        if (rateFor80Km8Hours) cityRate.rates[rateIndex].rateFor80Km8Hours = rateFor80Km8Hours;
        if (rateFor100Km8Hours) cityRate.rates[rateIndex].rateFor100Km8Hours = rateFor100Km8Hours;

        // Save the updated city rate document
        await cityRate.save();

        // Respond with success message and updated city rate data
        res.status(200).json({
            success: true,
            message: "Rate updated successfully",
            data: cityRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const deleteRate = async (req, res, next) => {
    try {
        const { cityName, category } = req.body;

        // Log request data
        console.log(req.body);

        // Validate if cityName and category are provided
        if (!cityName || !category) {
            return next(new AppError("cityName and category are required", 400));
        }

        // Find the category by name to get the category ID
        const validCategory = await LocalCategoryModel.findOne({ name: category });

        // Check if the category exists
        if (!validCategory) {
            return next(new AppError("Category not found", 404));
        }

        // Find city rate by cityName
        const cityRate = await LocalCityRate.findOne({ cityName });

        // If no rate is found for the given city, return error
        if (!cityRate) {
            return next(new AppError("No rate found for the given city", 404));
        }

        // Check if the given category ID exists in the rates array
        const rateIndex = cityRate.rates.findIndex(rate => rate.category.toString() === validCategory._id.toString());

        // If the category is not found in the rates array, return error
        if (rateIndex === -1) {
            return next(new AppError("No rate found for the given category in this city", 404));
        }

        // Remove the rate that corresponds to the given category
        cityRate.rates.splice(rateIndex, 1);

        // Save the updated city rate document
        await cityRate.save();

        // Return success response
        res.status(200).json({
            success: true,
            message: "Rate deleted successfully",
            data: cityRate,
        });
    } catch (error) {
        // Handle any errors
        return next(new AppError(error.message, 500));
    }
};



const deleteSpecificCategory = async (req, res, next) => {
    try {
        const { cityName } = req.body;

        if (!cityName) {
            return next(new AppError("City Name is Required", 400));
        }

        const cityRate = await LocalCityRate.findOneAndDelete({ cityName });

        if (!cityRate) {
            return next(new AppError("City Not Found", 404));
        }

        res.status(200).json({
            success: true,
            message: "City Rate deleted successfully",
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const getByLocationCategory = async (req, res, next) => {
    try {
        const { cityName, category } = req.body;

        if (!cityName) {
            return next(new AppError("City Name is Required", 400));
        }

        if (!category) {
            return next(new AppError("Category Is Required", 400));
        }

        const cityRate = await LocalCityRate.findOne({
            cityName,
            'rates.category': category
        }).populate('rates.category');

        if (!cityRate) {
            return next(new AppError("Rates Not Found for the Provided Category", 404));
        }

        const categoryRate = cityRate.rates.find(rate => rate.category.toString() === category);

        if (!categoryRate) {
            return next(new AppError("Rate Not Found for the Provided Category", 404));
        }

        res.status(200).json({
            success: true,
            message: "City Rate for the Category:",
            data: categoryRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


const updateRate=async(req,res,next)=>{
    try{

        console.log("ayush mishra updated rate");
        

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const laad=async(req,res,next)=>{
    try{

        console.log("llad");
        

    }catch(error){
        return next(new AppError(error.message))
    }
}

const addCity=async(req,res,next)=>{
    try{
        
        const {cityName}=req.body
        if(!cityName){
            return next(new AppError("City Name Required",400))
        }

        const localcityRate=await LocalCityRate.create({
            cityName
        })

        if(!localcityRate){
            return next(new AppError("City is Not Added Succesfully",400))
        }

        await localcityRate.save()

        res.status(200).json({
            success:true,
            message:"City Added Succesfully",
            data:localcityRate
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const getAllCityNames = async (req,res,next) => {
    try {
      // Fetch only the cityName field from all documents
      const cities = await LocalCityRate.find({}, { cityName: 1, _id: 0 });


      if(!cities){
        return next(new AppError("City Not Found",400))
      }
     
      res.status(200).json({
        success:true,
        message:"All City Name",
        data:cities
      })


    } catch (error) {
      console.error('Error fetching city names:', error);
       return(next(new AppError(error.message,500)))
    }
  };

export {
    addRate,
    getRate,
    deleteRate,
    updateLocalRate ,
    getByLocation,
    deleteSpecificCategory,
    getByLocationCategory,
    updateRate,
    laad,
    addCity,
    getAllCityNames
};
