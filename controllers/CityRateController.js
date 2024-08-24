import CityRate from "../models/Booking/CityRate.js";
import cityRate from "../routes/Booking/CarRate.js";
import AppError from "../utilis/error.utlis.js";


const addRate = async (req, res, next) => {
    try {
      const { fromCity, toCity, rate, category } = req.body;
  
      // Validate input
      if (!fromCity || !toCity || !rate || !category) {
        return next(new AppError("All fields are required", 400));
      }
  
      // Find the existing city rate document
      let cityRate = await CityRate.findOne({ fromCity, toCity });
  
      if (cityRate) {
        // Check if the category already exists in the rates array
        const categoryExists = cityRate.rates.some(
          (rateObj) => rateObj.category === category
        );
  
        if (categoryExists) {
          return next(new AppError("Rate for this category already exists for the given cities", 400));
        }
  
        // Add the new category and rate to the existing document
        cityRate.rates.push({ category, rate });
      } else {
        // Create a new document for the fromCity and toCity pair
        cityRate = await CityRate.create({
          fromCity,
          toCity,
          rates: [{ category, rate }],
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
  
const getRate=async(req,res,next)=>{
    try{

        const allCityRate=await CityRate.find({})

        if(!allCityRate){
            return next(new AppError("Rate Not Found",400))
        }

        res.status(200).json({
            success:true,
            message:"All City Rate",
            data:allCityRate
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const getByLocation=async(req,res,next)=>{
    try{

        const {fromCity,toCity}=req.body

        if(!fromCity || !toCity){
            return next(new AppError("Cities Are Required"))
        }

       const cityRate=await CityRate.find({fromCity,toCity})

      //  const rate = await getByLocationCategory(fromCity, toCity, 'Ertiga');

       console.log(rate);
       

       if(!cityRate){
        return next(new AppError("Cities Rates Not Found"))
       }

       res.status(200).json({
        success:true,
        message:"Distance Rate Are:-",
        data:cityRate
       })


    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const updateRate = async (req, res, next) => {
    try {
      const { fromCity, toCity, category, rate } = req.body;

      console.log(req.body);
      
  
      // Validate input
      if (!fromCity || !toCity || !category || !rate) {
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








export {
    addRate,
    getRate,
    deleteRate,
    updateRate,
    getByLocation,
    deleteSpecificCategory,
    getByLocationCategory
}