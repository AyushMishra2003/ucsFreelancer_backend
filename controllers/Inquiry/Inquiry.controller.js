import InquiryModel from "../../models/Inquiry/Inquiry.model.js";
import AppError from "../../utilis/error.utlis.js";

const addInquiry = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, message } = req.body;

    if (!fullName || !email || !phoneNumber || !message) {
      return next(new AppError("All Field are Required", 400));
    }

    if (phoneNumber.length != 10) {
      return next(new AppError("Phone Number Not Valid"));
    }

    const inqury = await InquiryModel.create({
      fullName,
      email,
      phoneNumber,
      message,
    });

    if (!inqury) {
      return next(new AppError("Inqiry not Send,Something Went Wrong", 400));
    }

    await inqury.save();

    res.status(200).json({
      success: true,
      message: "Inquiry Send Succesfully",
      data: inqury,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const getInquiry = async (req, res, next) => {
  try {
    const allInquiry = await InquiryModel.find({});

    if (!allInquiry) {
      return next(new AppError("Inquiry Not Found", 402));
    }

    res.status(200).json({
      success: true,
      message: "All Inquiry are:-",
      data: allInquiry,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deleteInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const validInquiry = await InquiryModel.findById(id);

    if (!validInquiry) {
      return next(new AppError("Inquiry is Not Valid", 400));
    }

    const deleteInquiry = await InquiryModel.findByIdAndDelete(id);

    // await InquiryModel.save();

    res.status(200).json({
      success: true,
      message: "Inquiry Delete Succesfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deleteAllInquiries = async (req, res, next) => {
  try {
    const result = await InquiryModel.deleteMany({}); // Deletes all inquiries
    console.log(result);

    if (result.deletedCount === 0) {
      return next(new AppError("No inquiries to delete", 400));
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} inquiries deleted successfully`,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export { addInquiry, getInquiry, deleteInquiry, deleteAllInquiries };
