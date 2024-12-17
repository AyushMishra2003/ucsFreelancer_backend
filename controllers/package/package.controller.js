
import fs from "fs";
import cloudinary from "cloudinary";

import AppError from "../../utilis/error.utlis.js";
import PackageModel from "../../models/package/package.model.js";
import PackageIncludeModel from "../../models/package/Includes.model.js";
import PackageCategoryModel from "../../models/package/PackageCategory.js";
import PackageTagModel from "../../models/package/packageTag.model.js";
import PackageQuery from "../../models/package/packegQuery.model.js";

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
      location,
      categories,
      packageTag
    } = req.body;



    // Validate and format `dayWise`
    const formattedDayWise = Array.isArray(dayWise)
      ? dayWise.map((item, index) => ({
          day: `Day ${index + 1}`, // Format as "Day 1", "Day 2", etc.
          description: item.content, // Keep only the content
        }))
      : [];

    // Validate and parse `includedPackages`
    let includedDetailsArray = [];
    if (includedPackages) {
      try {
        includedDetailsArray = JSON.parse(includedPackages);
      } catch (parseError) {
        console.error('Error parsing includedPackages:', parseError.message);
        throw new Error('Invalid includedPackages format. Must be valid JSON.');
      }
    }

    // Validate and parse `categories`
    let categoriesDetails = [];

    console.log("catogory is",categories);
    
    if (categories) {
      try {
        categoriesDetails = JSON.parse(categories);
      } catch (parseError) {
        console.error('Error parsing categories:', parseError.message);
        throw new Error('Invalid categories format. Must be valid JSON.');
      }
    }

    console.log("categirt details is",categoriesDetails);


    let packageDetail=[]

    if (packageTag) {
      try {
        packageDetail = JSON.parse(packageTag);
      } catch (parseError) {
        console.error('Error parsing categories:', parseError.message);
        throw new Error('Invalid categories format. Must be valid JSON.');
      }
    }
    

    // Create new package object
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
      mainPhoto: {
        public_id: "",
        secure_url: "",
      },
      categoriesDetails:categoriesDetails,
      location,
      photos: [],
      dayWise: formattedDayWise,
      includedDetails:includedDetailsArray,
      packageTagDetail:packageDetail
    });

    console.log("new package is",newPackage);
    


    // Handle the mainPhoto upload (single file)
    if (req.files && req.files.mainPhoto && req.files.mainPhoto.length > 0) {
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
    if (req.files && req.files.photos && req.files.photos.length > 0) {
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

    // Save the package to the database
    await newPackage.save();
    res.status(201).json({ message: 'Package added successfully', package: newPackage });
  } catch (error) {
    console.error('Error adding package:', error); // Log detailed error
    res.status(500).json({ message: 'Error adding package', error: error.message });
  }
};

// Edit a package
const editPackage = async (req, res) => {
  try {
    const { id } = req.params; // Get package ID from URL params
    const updateData = { ...req.body };

    // Handle mainPhoto
    if (req.files.mainPhoto && req.files.mainPhoto[0]) {
      // Upload the mainPhoto to Cloudinary
      const mainPhotoUpload = await cloudinary.uploader.upload(
        req.files.mainPhoto[0].path, // Local path of the uploaded file
        { folder: 'packages/mainPhoto' } // Optional folder in Cloudinary
      );

      updateData.mainPhoto = {
        public_id: mainPhotoUpload.public_id,
        secure_url: mainPhotoUpload.secure_url,
      };
    }

    // Handle photos (array of objects)
    if (req.files.photos && req.files.photos.length > 0) {
      const photosUploads = await Promise.all(
        req.files.photos.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: 'packages/photos' })
        )
      );

      updateData.photos = photosUploads.map((upload) => ({
        public_id: upload.public_id,
        secure_url: upload.secure_url,
      }));
    }

    // Update the package in MongoDB
    const updatedPackage = await PackageModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators during the update
    });

    res.status(200).json(updatedPackage); // Send the updated package in the response
  } catch (error) {
    console.error('Error updating package:', error); // Log the error for debugging
    res.status(500).json({ error: error.message }); // Return error response
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
       includeName,
       includePhoto:{
          public_id:"",
          secure_url:""
       }
    })

      // Handle the mainPhoto upload (single file)
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: "lms",
        });
        if (result) {
             includePackage.includePhoto = {
                public_id: result.public_id,
                secure_url: result.secure_url
            };
            await includePackage.save(); 
        }
  
        // Remove the file using fs.unlinkSync
        fs.unlinkSync(req.file.path); // Ensure correct file removal
        }

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
    console.log("updated iclude",updatedInclude);
    

          // Handle the mainPhoto upload (single file)
    if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
        });
        if (result) {
                updatedInclude.includePhoto = {
                  public_id: result.public_id,
                  secure_url: result.secure_url
                };
                await updatedInclude.save(); 
            }
      
            // Remove the file using fs.unlinkSync
            fs.unlinkSync(req.file.path); // Ensure correct file removal
            }
    
    

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

    console.log(id);
    

    // Find and delete the include
    const deletedInclude = await PackageIncludeModel.findById(id)

    // Check if the include exists
    if (!deletedInclude) {
      return next(new AppError("Package Include not found", 404));
    }

    await PackageIncludeModel.findByIdAndDelete(id)

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


// packageTag

const addPackageTag=async(req,res,next)=>{
  try{

    const {tagName}=req.body
    
    if(!tagName){
      return next(new AppError("All field are Required",400))
    }

    const addTag=new PackageTagModel({
       tagName
    })

    if(!addTag){
       return next(new AppError("Tag Not Added",400))
    }

    await addTag.save()

    res.status(200).json({
      success:true,
      message:"Tag Added Succesfully",
      data:addTag
    })

  }catch(error){
    return next(new AppError(error?.message,500))
  }
}

const getPackageTag=async(req,res,next)=>{
   try{
     
    const allTag=await PackageTagModel.find({})

    if(!allTag){
      return next(new AppError("Tag Not Found",500))
    }

    res.status(200).json({
      success:true,
      message:"ALL Tag Are:-",
      data:allTag
    })

   }catch(error){
    return next(new AppError(error.message,500))
   }
}

const editPackageTag = async (req, res, next) => {
  try {
    const { id } = req.params; // Assuming tag ID is passed as a URL parameter
    const { tagName } = req.body;

    // Validate input
    if (!id || !tagName) {
      return next(new AppError("Tag ID and tagName are required", 400));
    }

    // Find and update the tag
    const updatedTag = await PackageTagModel.findByIdAndUpdate(
      id,
      { tagName },
      { new: true, runValidators: true } // Return updated document and validate input
    );

    if (!updatedTag) {
      return next(new AppError("Tag not found or not updated", 404));
    }

    res.status(200).json({
      success: true,
      message: "Tag updated successfully",
      data: updatedTag,
    });
  } catch (error) {
    return next(new AppError(error?.message || "Error updating tag", 500));
  }
};


const deletePackageTag = async (req, res, next) => {
  try {
    const { id } = req.params; // Assuming tag ID is passed as a URL parameter

    console.log(id);
    

    // Validate input
    if (!id) {
      return next(new AppError("Tag ID is required", 400));
    }

    // Find and delete the tag
    const deletedTag = await PackageTagModel.findByIdAndDelete(id);

    if (!deletedTag) {
      return next(new AppError("Tag not found or already deleted", 404));
    }

    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
      data: deletedTag,
    });
  } catch (error) {
    return next(new AppError(error?.message || "Error deleting tag", 500));
  }
};



// query  


const addPackageQuery = async (req, res, next) => {
  try {
    const { destination, name, mobile, email, adults, children, infants, query } = req.body;

    console.log(req.body);
    

    // Create a new query instance
    const newPackageQuery = new PackageQuery({
      destination,
      name,
      mobile,
      email,
      adults,
      children,
      infants,
      query,
    });
  
    

    // Save to the database
    await newPackageQuery.save();

    res.status(201).json({
      success: true,
      message: "Package query added successfully!",
      data: newPackageQuery,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Controller to get all PackageQueries
 const getAllPackageQueries = async (req, res, next) => {
  try {
    const queries = await PackageQuery.find(); // Fetch all queries

    res.status(200).json({
      success: true,
      message: "Package queries fetched successfully!",
      data: queries,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Controller to get a single PackageQuery by ID
 const getPackageQueryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = await PackageQuery.findById(id);

    if (!query) {
      return next(new AppError("Package query not found!", 404));
    }

    res.status(200).json({
      success: true,
      message: "Package query fetched successfully!",
      data: query,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Controller to update a PackageQuery by ID
 const updatePackageQuery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedQuery = await PackageQuery.findByIdAndUpdate(id, updatedData, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation is run
    });

    if (!updatedQuery) {
      return next(new AppError("Package query not found!", 404));
    }

    res.status(200).json({
      success: true,
      message: "Package query updated successfully!",
      data: updatedQuery,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Controller to delete a PackageQuery by ID
 const deletePackageQuery = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedQuery = await PackageQuery.findByIdAndDelete(id);

    if (!deletedQuery) {
      return next(new AppError("Package query not found!", 404));
    }

    res.status(200).json({
      success: true,
      message: "Package query deleted successfully!",
      data: deletedQuery,
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
    deletePackageCategory,
    addPackageTag,
    getPackageTag,
    editPackageTag,
    deletePackageTag,
    addPackageQuery,
    getPackageQueryById,
    deletePackageQuery,
    getAllPackageQueries
}
