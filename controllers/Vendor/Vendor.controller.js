import VendorModel from "../../models/Vendor/Vendor.model.js";
import AppError from "../../utilis/error.utlis.js";

const addVendor = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, city, description } = req.body;
    console.log(req.body);

    if (!fullName || !email || !phoneNumber || !city || !description) {
      return next(new AppError("All Field are Required", 400));
    }

    const validVendor=await VendorModel.find({email})
    
    if(!validVendor){
      return next(new AppError("Email is already registred",400))
    }

    const vendor = await VendorModel.create({
      fullName,
      email,
      phoneNumber,
      city,
      description,
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor Added Succesfully",
      data: vendor,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const getVendor = async (req, res, next) => {
  try {
    const allVendors = await VendorModel.find({});
    if (!allVendors) {
      return next(new AppError("Vendors Not Found", 400));
    }

    res.status(200).json({
      success: true,
      message: "Vendor List",
      data: allVendors,
    });
  } catch (error) {
    return next(new AppError(error.message, 5000));
  }
};

const editVendor = async (req, res, next) => {
  try {
    const { id } = req.params; // Get the vendor ID from the request parameters
    const { fullName, email, phoneNumber, city, description } = req.body;

    // Check if the vendor exists
    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return next(new AppError("Vendor not found", 404));
    }

    // Update the vendor fields
    vendor.fullName = fullName || vendor.fullName;
    vendor.email = email || vendor.email;
    vendor.phoneNumber = phoneNumber || vendor.phoneNumber;
    vendor.city = city || vendor.city;
    vendor.description = description || vendor.description;

    // Save the updated vendor
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor Updated Successfully",
      data: vendor,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params; // Get the vendor ID from the request parameters

    // Check if the vendor exists
    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return next(new AppError("Vendor not found", 404));
    }

    // Delete the vendor
    await VendorModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Vendor Deleted Successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export { addVendor, getVendor, editVendor, deleteVendor };
