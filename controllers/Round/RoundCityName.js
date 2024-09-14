import roundCityModel from "../../models/Round/RoundCityName.model.js"
import AppError from "../../utilis/error.utlis.js"


const addCityName=async(req,res,next)=>{
    try{ 

        const {roundCityName}=req.body

        if(!roundCityName){
            return next(new AppError("Round City_Name Required ",400))
        }

        const roundCity=await roundCityModel.create({
            roundCityName  
        })

        if(!roundCity){
            return next(new AppError("Round City Name not Found",400))
        }

        await roundCity.save()

        res.status(200).json({
            success:true,
            message:"Round City Name added",
            data:roundCity
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const getCityName=async(req,res,next)=>{
    try{
       const allCity=await roundCityModel.find({})
       
       if(!allCity){
          return next(new AppError("City not Found",400))
       }

       res.status(200).json({
        success:true,
        message:"All Round City Name",
        data:allCity
       })
     

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const updateCityName = async (req, res, next) => {
    try {
        const { id} = req.params; // Assume city ID is passed in the URL as a parameter
        const { roundCityName } = req.body;

        // Validate the city name
        if (!roundCityName) {
            return next(new AppError("Round City Name is required", 400));
        }

        // Find and update the city name
        const updatedCity = await roundCityModel.findByIdAndUpdate(
            id, 
            { roundCityName }, 
            { new: true, runValidators: true }
        );

        // If no city found with the provided ID
        if (!updatedCity) {
            return next(new AppError("City not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "City Name updated successfully",
            data: updatedCity
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const deleteCityName = async (req, res, next) => {
    try {
        const { id } = req.params; // Assume city ID is passed in the URL as a parameter

        // Find and delete the city name
        const deletedCity = await roundCityModel.findByIdAndDelete(id);

        // If no city found with the provided ID
        if (!deletedCity) {
            return next(new AppError("City not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "City Name deleted successfully",
            data: deletedCity
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};




export {
    addCityName,
    getCityName,
    updateCityName,
    deleteCityName
}