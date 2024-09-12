import LocalCategoryModel from "../../models/Local/LocalCategoryModel.js";
import AppError from '../../utilis/error.utlis.js'


const addLocalCategory=async(req,res,next)=>{
    try{

        const {name,description}=req.body

        if(!name){
            return next(new AppError("Category Name is Required",400))
        }

        const localCategory=await LocalCategoryModel.create({
            name,
            description
        })

        if(!localCategory){
            return next(new AppError("New Category Not Added",400))
        }

        await localCategory.save()


        res.status(200).json({
            success:true,
            message:"New Category Added",
            data:localCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


const getByLocationCategory=async(req,res,next)=>{
    try{

        const allCategory=await LocalCategoryModel.find({})

        if(!allCategory){
            return next(new AppError("Category Not  Found",400))
        }

        res.status(200).json({
            success:true,
            message:"ALL Local Category are:-",
            data:allCategory
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}

const editLocalCategory=async(req,res,next)=>{
    try{

        console.log("mai aa raha hu bhai");
        
        const {id}=req.params

        const {name,description}=req.body
        
        const validCategory=await LocalCategoryModel.findById(id)

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

const deletLocalCategory=async(req,res,next)=>{
    try{

        const {id}=req.params

        const validCategory=await LocalCategoryModel.findById(id)

        if(!validCategory){
            return next(new AppError("Category is Not Valid",400))
        }


        await LocalCategoryModel.findByIdAndDelete(id)

        res.status(200).json({
            success:true,
            message:"Local Category Delete Succesfully"
        })

    }catch(error){
        return next(new AppError(error.message,500))
    }
}


async function updateExistingCategories() {
    try {
      // Find categories missing the new fields and update them
      const categories = await LocalCategoryModel.find({});
  
      categories.forEach(async (category) => {
        if (!category.numberOfSeats) category.numberOfSeats = 0; // Default value
        if (category.acAvailable === undefined) category.acAvailable = false; // Default value
        if (!category.numberOfBags) category.numberOfBags = 0; // Default value
  
        // Save updated category
        await category.save();
      });
  
      console.log('Existing categories updated');
    } catch (err) {
      console.error('Error updating existing categories:', err);
    }
  }
  



export {
    addLocalCategory,
    getByLocationCategory,
    editLocalCategory,
    deletLocalCategory
}