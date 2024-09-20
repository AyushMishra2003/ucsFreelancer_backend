import roundCategoryModel from "../../models/Round/Round.category.model.js"
import RoundCityRate from "../../models/Round/Round.Rates.model.js"
import AppError from "../../utilis/error.utlis.js"



const addRoundCity=async(req,res,next)=>{
    try{

        const {cityName,category,perKm,extraKm}=req.body
    

        console.log(req.body);
        
         
        if(!cityName || !category || !perKm || !extraKm){
            return next(new AppError("All Field are Required",400))
        }

        const roundCategory=await roundCategoryModel.findOne({name:category})

        if(!roundCategory){
            return next(new AppError("Category Not Found",400))
        }

        
        console.log(roundCategory);
        
        const categoryId=roundCategory._id

        console.log(categoryId);
        


        let roundCityRate=await RoundCityRate.findOne({cityName})

        if(roundCityRate){


            console.log(roundCityRate);
            

            const categoryExists = roundCityRate.rates.some(
                (rateObj) => rateObj.category && rateObj.category.toString() === categoryId.toString()
            );
        
            if (categoryExists) {
                return next(new AppError("Rate for this category already exists for the given city", 400));
            }
        
            // Ensure you're adding the 'category' field when pushing a new rate object
            roundCityRate.rates.push({ category: categoryId, perKm, extraKm });

        }else{

        roundCityRate=await RoundCityRate.create({
            cityName,
            rates: [{ category: categoryId, perKm,extraKm }],
        })
    }

        if(!roundCityRate){
            return next(new AppError("Round City Not Created",400))
        }

        await roundCityRate.save()


        res.status(200).json({
            success:true,
            message:"Round City Added",
            data:roundCityRate
        })



    }catch(error){
        return next(new AppError(error.message,500))
    }
}

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



export {
    addRoundCity,
    getRoundCity
}