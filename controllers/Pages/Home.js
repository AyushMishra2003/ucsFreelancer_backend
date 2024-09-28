import commonModel from "../../models/CommonStrcuture/common.strcuture.js";
import AppError from "../../utilis/error.utlis.js";

const addHome = async (req, res, next) => {
  try {
    const { title, description, page } = req.body;

    if (!title || !description) {
      return next(new AppError("All field are Required", 50));
    }

    const strcuture = await commonModel({
      title,
      description,
      page: "Home",
    });

    await strcuture.save();

    res.status(200).json({
      success: true,
      message: "Added Succesfully",
      data: strcuture,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const getHome = async (req, res, next) => {
  try {
    const allHome = await commonModel.find({ page: "Home" });
    console.log("how are you");

    res.status(200).json({
      success: true,
      message: "Get Home",
      data: allHome,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export { addHome, getHome };
