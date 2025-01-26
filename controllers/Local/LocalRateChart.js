import LocalCityRate from "../../models/Local/LocalCityRateModel.js";
import LocalCategoryModel from "../../models/Local/LocalCategoryModel.js";
import AppError from "../../utilis/error.utlis.js";
import mongoose, { Types } from "mongoose";

const addRate = async (req, res, next) => {
    try {
        const { cityName, category, perKm, perHour, rateFor80Km8Hours, rateFor120Km12Hours } = req.body;

        // Validate input
        if (!cityName || !category || !perKm || !perHour || !rateFor80Km8Hours || !rateFor120Km12Hours) {
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
            cityRate.rates.push({ category: categoryId, perKm, perHour, rateFor80Km8Hours, rateFor120Km12Hours });
        } else {
            // Create a new document for the city
            cityRate = await LocalCityRate.create({
                cityName,
                rates: [{ category: categoryId, perKm, perHour, rateFor80Km8Hours, rateFor120Km12Hours }],
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


        allCityRate.forEach(cityRate => {
            // Ensure rates array exists and sort it by 'perKm'
            if (cityRate.rates && Array.isArray(cityRate.rates)) {
              cityRate.rates.sort((a, b) =>a.rateFor80Km8Hours - b.rateFor80Km8Hours); // Sorting by 'perKm' in ascending order
            }
          });
          

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

        // Fetch the city rate with the fully populated category details
        const cityRate = await LocalCityRate.findOne({ cityName })
            .populate({
                path: 'rates.category', // Populate the category field within rates
                model: 'UCS_Local_Category' // Make sure this matches your category model
            });

            if (cityRate && cityRate.rates && Array.isArray(cityRate.rates)) {
                cityRate.rates.sort((a, b) => a.rateFor80Km8Hours - b.rateFor80Km8Hours); // Sorting by 'rate' in ascending order
              }     

        if (!cityRate) {
            return next(new AppError("City Rate Not Found", 404));
        }

        // Format the response data to include the full category object
        const formattedRates = cityRate.rates.map(rate => ({
            category: rate.category ? rate.category : 'Unknown Category', // Pass the entire category object
            rate: {
                perKm: rate.perKm,
                perHour: rate.perHour,
                rateFor80Km8Hours: rate.rateFor80Km8Hours,
                rateFor120Km12Hours: rate.rateFor120Km12Hours
            }
        }));

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

        const { cityName, category, perKm, perHour, rateFor80Km8Hours, rateFor120Km12Hours
        } = req.body;

        console.log("req.body is",req.body);
        console.log("i am runing");
        
        

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
        if (rateFor120Km12Hours) cityRate.rates[rateIndex].rateFor120Km12Hours =rateFor120Km12Hours;

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
    const { cityName, categoryId } = req.body;

    console.log("Request Body:", req.body);

    try {
        // Check if categoryId is valid
        if (!Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId format" });
        }

        // Find the city document
        const city = await LocalCityRate.findOne({ cityName });

        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }

        // Check if the category exists and filter out the rates
        const updatedRates = city.rates.filter(rateObj => 
            rateObj._id.toString() !== categoryId.toString()
        );

        console.log(updatedRates);
        

        // Update the city document with the new rates array
        city.rates = updatedRates;

        // Save the updated city document
        await city.save();

        res.status(200).json({ message: 'Rate deleted successfully', city });
    } catch (error) {
        console.error('Error deleting rate:', error);
        res.status(500).json({ message: 'Failed to delete rate' });
    }
};


const deleteSpecificCategory = async (req, res, next) => {
    try {
        console.log("aysuh don");
        
        const { cityName } = req.body;
        console.log(req.body);
        

        if (!cityName) {
            return next(new AppError("City Name is Required", 400));
        }

        const cityRate = await LocalCityRate.findOneAndDelete({ cityName });

        if (!cityRate) {
            return next(new AppError("City Not Found", 404));
        }

        res.status(200).json({
            success: true,
            message: "City deleted successfully",
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
