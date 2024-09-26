import CityRate from "../models/Booking/CityRate.js";
import oneWayCategoryModel from "../models/oneway/Category.model.js";
import cityRate from "../routes/Booking/CarRate.js";
import AppError from "../utilis/error.utlis.js";


const addRate = async (req, res, next) => {
  try {
    const { fromCity, toCity, rate, category, extraKm } = req.body;

    // Validate input
    if (!fromCity || !toCity || !rate || !category) {
      return next(new AppError("All fields are required", 400));
    }

    // Find the category by name
    const oneWayCategory = await oneWayCategoryModel.findOne({ name: category });

    if (!oneWayCategory) {
      return next(new AppError("Category not found", 400));
    }

    const categoryId = oneWayCategory._id;

    // Find the existing city rate document for the city pair
    let cityRate = await CityRate.findOne({ fromCity, toCity });

    if (cityRate) {
      // Check if the category already exists in the rates array
      const categoryExists = cityRate.rates.some(
        (rateObj) => String(rateObj.category) === String(categoryId)
      );

      if (categoryExists) {
        return next(new AppError("Rate for this category already exists for the given cities", 400));
      }

      // If category does not exist, add the new category and rate
      cityRate.rates.push({ category: categoryId, rate, extraKm });
    } else {
      // If no cityRate document exists, create a new one
      cityRate = await CityRate.create({
        fromCity,
        toCity,
        rates: [{ category: categoryId, rate, extraKm }],
      });
    }

    // Save the updated or new document
    await cityRate.save();

    res.status(200).json({
      success: true,
      message: "Rate added successfully",
      data: cityRate,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


  
const getRate = async (req, res, next) => {
  try {
    // Find all CityRate documents and populate the category field
    const allCityRates = await CityRate.find()
      .populate({
        path: 'rates.category', // Path to the field to populate
        model: 'UCS_OneWay_Category', // The model to use for population
        select: 'name photo numberOfSeats acAvailable numberOfBags' // Select fields to include
      });

    if (!allCityRates || allCityRates.length === 0) {
      return next(new AppError("Rate Not Found", 400));
    }

    res.status(200).json({
      success: true,
      message: "All City Rates",
      data: allCityRates
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};


const getByLocation = async (req, res, next) => {
  try {
    const { fromCity, toCity } = req.body;

    if (!fromCity || !toCity) {
      return next(new AppError("Cities Are Required", 400));
    }

    // Fetch rates based on fromCity and toCity, and populate the category field
    const cityRate = await CityRate.findOne({ fromCity, toCity })
      .populate({
        path: 'rates.category', // Path to populate
        model: 'UCS_OneWay_Category', // Model to use for population
        select: 'name photo numberOfSeats acAvailable numberOfBags' // Fields to include
      });

      console.log(cityRate);
      

    if (!cityRate) {
       res.status(200).json({
        success:true,
        message:"Distance Rates Are",
        data:[]
       })
    }

    // Format response data with populated category details
    // const formattedRates = cityRate.rates.map(rate => ({
    //   category: {
    //     _id: rate.category._id,
    //     name: rate.category.name,
    //     photo: rate.category.photo,
    //     numberOfSeats: rate.category.numberOfSeats,
    //     acAvailable: rate.category.acAvailable,
    //     numberOfBags: rate.category.numberOfBags
    //   },
    //   rate: rate.rate
    // }));

    res.status(200).json({
      success: true,
      message: "Distance Rates Are:",
      data:cityRate
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const updateRate = async (req, res, next) => {
  try {
    const { fromCity, toCity, categoryId, rate } = req.body;

    // Validate input
    if (!fromCity || !toCity || !categoryId || rate === undefined) {
      return next(new AppError("fromCity, toCity, categoryId, and rate are all required", 400));
    }

    // Ensure categoryId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(new AppError("Invalid categoryId", 400));
    }

    // Find the city rate document based on fromCity and toCity
    const cityRate = await CityRate.findOne({ fromCity, toCity });

    if (!cityRate) {
      return next(new AppError("No rate found for the given cities", 404));
    }

    // Find the category in the rates array
    const rateIndex = cityRate.rates.findIndex(rateObj => rateObj.category.toString() === categoryId);

    if (rateIndex === -1) {
      return next(new AppError("No category found for the given cities", 404));
    }

    // Update the rate for the specified category
    cityRate.rates[rateIndex].rate = rate;

    // Save the updated document
    await cityRate.save();

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
      const { fromCity, toCity, category } = req.body;
  
      // Validate input
      if (!fromCity || !toCity || !category) {
        return next(new AppError("fromCity, toCity, category, and newRate are all required", 400));
      }
  
      // Find the city rate document based on fromCity and toCity
      const cityRate = await CityRate.findOne({ fromCity, toCity });
  
      if (!cityRate) {
        return next(new AppError("No rate found for the given cities", 404));
      }
  
      // Find the category in the rates array
      const rateIndex = cityRate.rates.findIndex((rateObj) => rateObj.category === category);
  
      if (rateIndex === -1) {
        return next(new AppError("No category found for the given cities", 404));
      }
  
         // Remove the category from the rates array
      cityRate.rates.splice(rateIndex, 1);
  
      // Save the updated document
      await cityRate.save();
  
      res.status(200).json({
        success: true,
        message: "Rate updated successfully",
        data: cityRate,
      });
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
};

const deleteSpecificCategory=async(req,res,next)=>{
    try{
         const {toCity,fromCity}=req.body

        const cityRate=await CityRate.find({fromCity,toCity})
          
        console.log(cityRate);



        
        

        if(cityRate.length===0){
            return next(new AppError("City Not Found"))
        }

        await CityRate.findOneAndDelete({fromCity,toCity})

        // await cityRate.save()

        res.status(200).json({
            success:true,
            message:"Delete City Succesfully",
        })

    }catch(error){
        return next(new AppError(error.message))
    }
}


const  getByLocationCategory = async (req, res, next) => {
  try {
      const { fromCity, toCity, category } = req.body;

      if (!fromCity || !toCity) {
          return next(new AppError("Cities Are Required", 400));
      }

      if (!category) {
          return next(new AppError("Category Is Required", 400));
      }

      // Fetch data from the database
      const cityRates = await CityRate.findOne({
          fromCity,
          toCity,
          'rates.category': category
      });

      if (!cityRates) {
          return next(new AppError("Rates Not Found for the Provided Category", 404));
      }

      // Filter the specific category rate
      const categoryRate = cityRates.rates.find(rate => rate.category === category);

      if (!categoryRate) {
          return next(new AppError("Rate Not Found for the Provided Category", 404));
      }

      res.status(200).json({
          success: true,
          message: "Distance Rate for the Category:",
          data: categoryRate
      });
  } catch (error) {
      return next(new AppError(error.message, 500));
  }
};


const getAllCities = async (req, res, next) => {
  try {
    // Aggregate to get unique fromCity and toCity

    console.log("ayush mishra");

    const p1=await CityRate.find({})
    console.log(p1);
    
    
    const cities = await CityRate.aggregate([
      {
        $group: {
          _id: null,
          fromCities: { $addToSet: "$fromCity" },
          toCities: { $addToSet: "$toCity" }
        }
      },
      {
        $project: {
          _id: 0,
          fromCities: 1,
          toCities: 1
        }
      }
    ]);

    if (!cities.length) {
      return next(new AppError("No cities found", 402));
    }

    res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: cities
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};








export {
    addRate,
    getRate,
    deleteRate,
    updateRate,
    getByLocation,
    deleteSpecificCategory,
    getByLocationCategory,
    getAllCities
}