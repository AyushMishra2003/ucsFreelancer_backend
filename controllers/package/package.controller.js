
import fs from "fs";
import cloudinary from "cloudinary";

import AppError from "../../utilis/error.utlis.js";
import PackageModel from "../../models/package/package.model.js";

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
      includedPackages
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


export {
    addPackage,
    editPackage,
    getAllPackages,
    getParticularPackage,
    deletePackage
}
