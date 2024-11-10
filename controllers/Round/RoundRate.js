import roundCategoryModel from "../../models/Round/Round.category.model.js"
import RoundCityRate from "../../models/Round/Round.Rates.model.js"
import AppError from "../../utilis/error.utlis.js"

const addRoundCity = async (req, res, next) => {
    try {
        const { cityName, category, perKm, extraKm } = req.body;

        // Validate cityName (since it's required)
        if (!cityName) {
            return next(new AppError("City name is required", 400));
        }

        // Check if the city already exists
        let roundCityRate = await RoundCityRate.findOne({ cityName });

        // If only cityName is provided, add a new city without rates
        if (!category && !perKm && !extraKm) {
            if (roundCityRate) {
                return next(new AppError("City already exists", 400));
            }

            // Create a new city with no rates
            roundCityRate = new RoundCityRate({
                cityName,
                rates: [],
            });

            await roundCityRate.save();

            return res.status(200).json({
                success: true,
                message: "City added successfully",
                data: roundCityRate,
            });
        }

        // Validate remaining fields for adding a rate
        if (!category || !perKm || !extraKm) {
            return next(new AppError("All rate fields are required when adding rates", 400));
        }

        // Check if the category exists
        const roundCategory = await roundCategoryModel.findOne({ name: category });
        if (!roundCategory) {
            return next(new AppError("Category not found", 400));
        }

        const categoryId = roundCategory._id;

        // If the city exists, proceed to add/update rates
        if (roundCityRate) {
            // Check if the category already exists for the city
            const categoryExists = roundCityRate.rates.some(
                (rateObj) =>
                    rateObj.category.toString() === categoryId.toString()
            );

            if (categoryExists) {
                return next(new AppError("Rate for this category already exists for the city", 400));
            }

            // Add the new category, perKm, and extraKm to the existing city
            roundCityRate.rates.push({
                category: categoryId,
                perKm,
                extraKm,
            });
        } else {
            // If the city doesn't exist, create a new document with rates
            roundCityRate = new RoundCityRate({
                cityName,
                rates: [{ category: categoryId, perKm, extraKm }],
            });
        }

        // Save the updated or new document
        await roundCityRate.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Round city rate added successfully",
            data: roundCityRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


const getRoundCity=async(req,res,next)=>{
    const {cityName}=req.body

    console.log(req.body);
    

    if(!cityName){
        return next(new AppError("City Name Required",400))
    }

    const allCity=await RoundCityRate.findOne({cityName})
        .populate({
              path: 'rates.category', // Populate the category field within rates
            model: 'UCS_Round_Category' // Make sure this matches your category model
        });
        if (allCity && allCity.rates) {
            // Sorting the rates array by 'perKm' in ascending order
            allCity.rates.sort((a, b) => a.perKm - b.perKm); // For ascending order
        
            // If you want descending order, you can do:
            // allCity.rates.sort((a, b) => b.perKm - a.perKm);
        }
        
        console.log(allCity); // Now allCity has sorted rates

        

    if(!allCity){
        return next(new AppError("Category Not Found",400))
    }

    res.status(200).json({
        success:true,
        message:"City Category List",
        data:allCity
    })
}


const getRoundCityRate=async(req,res,next)=>{

    const allCity=await RoundCityRate.find({})
        .populate({
              path: 'rates.category', // Populate the category field within rates
            model: 'UCS_Round_Category' // Make sure this matches your category model
        });

   console.log(allCity);
        

    if(!allCity){
        return next(new AppError("Category Not Found",400))
    }

    res.status(200).json({
        success:true,
        message:"City Category List",
        data:allCity
    })
}


const editRoundCityRate = async (req, res, next) => {
    try {
        console.log("mai aaya");
        
        const { cityName, category, perKm, extraKm } = req.body;

        console.log(req.body);
        

        // Validate required fields
        if (!cityName || !category || !perKm || !extraKm) {
            return next(new AppError("All fields are required", 400));
        }

        // Find the city by name
        let roundCityRate = await RoundCityRate.findOne({ cityName });
        if (!roundCityRate) {
            return next(new AppError("City not found", 404));
        }

        // Find the category ID from the category name
        const roundCategory = await roundCategoryModel.findOne({ name: category });
        if (!roundCategory) {
            return next(new AppError("Category not found", 404));
        }

        const categoryId = roundCategory._id;

        // Find the specific rate by category and update it
        const rateIndex = roundCityRate.rates.findIndex(
            (rateObj) => rateObj.category.toString() === categoryId.toString()
        );

        if (rateIndex === -1) {
            return next(new AppError("Rate for this category not found in the city", 404));
        }

        // Update the rate details
        roundCityRate.rates[rateIndex].perKm = perKm;
        roundCityRate.rates[rateIndex].extraKm = extraKm;

        // Save the updated city rate
        await roundCityRate.save();

        return res.status(200).json({
            success: true,
            message: "Rate updated successfully",
            data: roundCityRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const deleteRoundCityRate = async (req, res, next) => {
    try {
        const { cityName, category } = req.body;

        console.log(req.body);
        

        // Validate required fields
        if (!cityName || !category) {
            return next(new AppError("City name and category are required", 400));
        }

        // Find the city by name
        let roundCityRate = await RoundCityRate.findOne({ cityName });
        if (!roundCityRate) {
            return next(new AppError("City not found", 404));
        }

        // Find the category ID from the category name
        const roundCategory = await roundCategoryModel.findOne({ name: category });
        if (!roundCategory) {
            return next(new AppError("Category not found", 404));
        }

        const categoryId = roundCategory._id;

        // Find the index of the rate to delete
        const rateIndex = roundCityRate.rates.findIndex(
            (rateObj) => rateObj.category.toString() === categoryId.toString()
        );

        if (rateIndex === -1) {
            return next(new AppError("Rate for this category not found in the city", 404));
        }

        // Remove the rate from the city's rates
        roundCityRate.rates.splice(rateIndex, 1);

        // Save the updated city rate
        await roundCityRate.save();

        return res.status(200).json({
            success: true,
            message: "Rate deleted successfully",
            data: roundCityRate,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};




const getRoundAllCity = async (req,res,next) => {
    try {
      // Fetch only the cityName field from all documents
      const cities = await RoundCityRate.find({}, { cityName: 1, _id: 0 });


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
  

const deleteRoundCity=async(req,res,next)=>{
    try{
        const {cityName}=req.body

        console.log(req.body);
        

        const roundCity=await RoundCityRate.findOne({cityName})

        if(!roundCity){
            return next(new AppError("City Not Found",500))
        }

        await RoundCityRate.findOneAndDelete({cityName})

        res.status(200).json({
            success:true,
            message:"City Delete Succesfully"
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}



export {
    addRoundCity,
    getRoundCity,
    getRoundAllCity,
    getRoundCityRate,
    editRoundCityRate,
    deleteRoundCityRate,
    deleteRoundCity
}