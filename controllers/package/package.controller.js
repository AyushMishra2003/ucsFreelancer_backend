
import fs from "fs";
import cloudinary from "cloudinary";


import AppError from "../../utilis/error.utlis.js";
import PackageModel from "../../models/package/package.model.js";
import PackageIncludeModel from "../../models/package/Includes.model.js";
import PackageCategoryModel from "../../models/package/PackageCategory.js";

// Add a new package
const addPackage = async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      duration,
      rate,
      locationRate,
      inclusive,
      exclusive,
      bookingPolicy,
      termsAndCondition,
      packageName,
      dayWise, 
      includedPackages,
      location
    //   dayWise,
    } = req.body;

    console.log(req.body);

    const formattedDayWise = dayWise.map((item, index) => ({
      day: `Day ${index + 1}`, // Format as "Day 1", "Day 2", etc.
      description: item.content, // Keep only the content
    }));

    const includedDetailsArray = JSON.parse(includedPackages);
    

    const newPackage = new PackageModel({
      packageName,
      dateFrom,
      dateTo,
      duration,
      rate,
      locationRate,
      inclusive,
      exclusive,
      bookingPolicy,
      termsAndCondition,
      mainPhoto:{
        public_id:"",
        secure_url:""
      },
      location,
      photos: [], // Initialize photos as an empty array
    //   dayWise, // Directly use the array from the frontend,
    dayWise: formattedDayWise, // Use the transformed dayWise,
    includedDetails:includedDetailsArray
    });


    console.log(req.file);



    

 // Handle the mainPhoto upload (single file)
 if (req.files && req.files.mainPhoto) {
  const result = await cloudinary.v2.uploader.upload(req.files.mainPhoto[0].path, {
    folder: 'lms', // Cloudinary folder for the main photo
  });

  newPackage.mainPhoto = {
    public_id: result.public_id,
    secure_url: result.secure_url,
  };
  fs.unlinkSync(req.files.mainPhoto[0].path); // Remove the file from local storage after upload
}

// Handle multiple photos upload (photos array)
if (req.files && req.files.photos) {
  for (const photo of req.files.photos) {
    const photoResult = await cloudinary.v2.uploader.upload(photo.path, {
      folder: 'packages/photos', // Cloudinary folder for the additional photos
    });

    newPackage.photos.push({
      public_id: photoResult.public_id,
      secure_url: photoResult.secure_url,
    });
    fs.unlinkSync(photo.path); // Remove the file after uploading
  }
}

    await newPackage.save();
    res.status(201).json({ message: "Package added successfully", package: newPackage });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Error adding package", error: error.message });
  }
};

// Edit a package
const editPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Handle dayWise array
    if (updatedData.dayWise) {
      updatedData.dayWise = JSON.parse(updatedData.dayWise); // Convert JSON string to array if needed
    }

    // Handle main photo update
    if (req.files && req.files.mainPhoto) {
      const mainPhotoResult = await cloudinary.v2.uploader.upload(req.files.mainPhoto[0].path, {
        folder: "packages",
      });
      updatedData.mainPhoto = {
        public_id: mainPhotoResult.public_id,
        secure_url: mainPhotoResult.secure_url,
      };
      fs.unlinkSync(req.files.mainPhoto[0].path); // Remove local file
    }

    // Handle multiple photos update
    if (req.files && req.files.photos) {
      updatedData.photos = []; // Reset the photos array
      for (const photo of req.files.photos) {
        const photoResult = await cloudinary.v2.uploader.upload(photo.path, {
          folder: "packages/photos",
        });
        updatedData.photos.push({
          public_id: photoResult.public_id,
          secure_url: photoResult.secure_url,
        });
        fs.unlinkSync(photo.path); // Remove local file
      }
    }

    const updatedPackage = await PackageModel.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });

    res.status(200).json({ message: "Package updated successfully", package: updatedPackage });
  } catch (error) {
    res.status(500).json({ message: "Error updating package", error: error.message });
  }
};

// Get all packages
 const getAllPackages = async (req, res,next) => {
  try {
    console.log("ayush");
    const allpackages=await PackageModel.find({})

    if(!allpackages){
      return next(new AppError("Package not Found",400))
    }
    res.status(200).json({
        success:true,
        message:"All Package are:-",
        data:allpackages
    })
    // const packages = await Package.find({});
    //   res.status(200).json({
    //     success:true,
    //     message:"All Package are:-",
    //     data:packages
    //   })
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages", error: error.message });
  }
};

// Get a particular package by ID
const getParticularPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const packageData = await PackageModel.findById(id);
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    res.status(200).json(packageData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching package", error: error.message });
  }
};

// Delete a package
 const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const packageData = await PackageModel.findById(id);
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    // Remove main photo from Cloudinary
    if (packageData.mainPhoto.public_id) {
      await cloudinary.v2.uploader.destroy(packageData.mainPhoto.public_id);
    }

    // Remove all photos from Cloudinary
    for (const photo of packageData.photos) {
      await cloudinary.v2.uploader.destroy(photo.public_id);
    }

    await PackageModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package", error: error.message });
  }
};


// included

const addPackageInclude=async(req,res,next)=>{
  try{
    const {includeName}=req.body
     

    const includePackage=new PackageIncludeModel({
       includeName
    })

    const all=await PackageIncludeModel.find({})

    console.log(all);
    

    if(!includePackage){
      return next(new AppError("Included Not Added",400))
    }

    await includePackage.save()

     res.status(200).json({
      success:true,
      message:"Package Include Added",
      data:includePackage
     })


  }catch(error){
    return next(new AppError(error.message,500))
  }
}

const getPackageInclude=async(req,res,next)=>{
  try{
    console.log("chala");
     
    const allPackageInclude=await PackageIncludeModel.find({})


    if(!allPackageInclude){
      return next(new AppError("Package Included not Find",400))
    }

     res.status(200).json({
      success:true,
      message:"Package Include Added",
      data:allPackageInclude
     })


  }catch(error){
  
    
    return next(new AppError(error.message,500))
  }
}

const editPackageInclude = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of the include to edit
    const { includeName } = req.body; // Updated data

    // Find and update the include
    const updatedInclude = await PackageIncludeModel.findByIdAndUpdate(
      id, 
      { includeName }, 
      { new: true, runValidators: true }
    );

    // Check if the include exists
    if (!updatedInclude) {
      return next(new AppError("Package Include not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Package Include updated successfully",
      data: updatedInclude,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


const deletePackageInclude = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of the include to delete

    // Find and delete the include
    const deletedInclude = await PackageIncludeModel.findByIdAndDelete(id);

    // Check if the include exists
    if (!deletedInclude) {
      return next(new AppError("Package Include not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Package Include deleted successfully",
      data: deletedInclude,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


// category 

const addPackageCategory=async(req,res,next)=>{
  try{

    const {categoryName}=req.body

    console.log(categoryName);
    
    
    if(!categoryName){
      return next(new AppError("Package Category Name is Required",400))
    }

    const packageCategoryName=await PackageCategoryModel.create({
      categoryName,
      categoryPhoto:{
        public_id:"",
        secure_url:""
      }
    })

    if(!packageCategoryName){
      return next(new AppError("Package Category  is not Added",400))
    }

     // Handle the mainPhoto upload (single file)
     if (req.file) {
      console.log('File Upload:', req.file);
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
      });
      if (result) {
          packageCategoryName.categoryPhoto = {
              public_id: result.public_id,
              secure_url: result.secure_url
          };
          await packageCategoryName.save(); 
      }

      // Remove the file using fs.unlinkSync
      fs.unlinkSync(req.file.path); // Ensure correct file removal
  }

  await packageCategoryName.save()


  res.status(200).json({
    success:true,
    message:"Package Category Added",
    data:packageCategoryName
  })



  }catch(error){
    return next(new AppError(error.message,500))
  }
}

const getPackageCategory=async(req,res,next)=>{
  try{

    const allPackageCategory=await PackageCategoryModel.find({})

    if(!allPackageCategory){
      return next(new AppError("Packages not Found",400))
    }

    res.status(200).json({
      success:true,
      message:"All Package Category are:-",
      data:allPackageCategory
    })

  }catch(error){
    return next(new AppError(error.message,500))
  }
}

const editPackageCategory = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of the category to edit
    const { categoryName } = req.body; // Updated data

    console.log(req.body);
    

    // Find the package category by ID
    const packageCategory = await PackageCategoryModel.findById(id);

    // If category doesn't exist
    if (!packageCategory) {
      return next(new AppError("Package Category not found", 404));
    }

    // Update category name if provided
    if (categoryName) {
      packageCategory.categoryName = categoryName;
    }

    // Handle file upload for category photo (if a new file is provided)
    if (req.file) {
      console.log("File Upload:", req.file);
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      if (result) {
        // Update category photo
        packageCategory.categoryPhoto = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
        // Remove the uploaded file
        fs.unlinkSync(req.file.path); // Ensure correct file removal
      }
    }

    // Save the updated category
    await packageCategory.save();

    res.status(200).json({
      success: true,
      message: "Package Category updated successfully",
      data: packageCategory,
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deletePackageCategory = async (req, res, next) => {
  try {
    const { id } = req.params; // ID of the category to delete

    // Find the package category by ID
    const packageCategory = await PackageCategoryModel.findById(id);

    // If category doesn't exist
    if (!packageCategory) {
      return next(new AppError("Package Category not found", 404));
    }

    // Delete the package category from the database
    await PackageCategoryModel.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "Package Category deleted successfully",
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};







export {
    addPackage,
    editPackage,
    getAllPackages,
    getParticularPackage,
    deletePackage,
    addPackageInclude,
    getPackageInclude,
    editPackageInclude,
    deletePackageInclude,
    addPackageCategory,
    getPackageCategory,
    editPackageCategory,
    deletePackageCategory
}
