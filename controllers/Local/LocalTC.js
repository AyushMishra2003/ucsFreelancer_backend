import LocalTerm from "../../models/Local/LocalTermCondtion.js";
import AppError from "../../utilis/error.utlis.js";


// Add or update term and condition based on tripType
const addLocalTC = async (req, res, next) => {
    try {
      const { tripType, tC } = req.body;
  
      if (!tripType || !tC) {
        return next(new AppError("TripType and Term and Condition are required", 400));
      }
  
      // Find the single existing document
      let termCondition = await LocalTerm.findOne();
  
      if (termCondition) {
        // Check if the tripType already exists in the data array
        const existingTripType = termCondition.data.find(
          (item) => item.tripType === tripType
        );
  
        if (existingTripType) {
          // If tripType exists, push the new term and condition into the tC array
          existingTripType.tC.push(tC);
        } else {
          // If tripType doesn't exist, add a new entry with tripType and tC array
          termCondition.data.push({ tripType, tC: [tC] });
        }
  
        // Save the updated document
        await termCondition.save();
  
        return res.status(200).json({
          success: true,
          message: `Term and condition updated for trip type: ${tripType}`,
          data: termCondition,
        });
      } else {
        // If no document exists, create a new one with the tripType and tC array
        const newTermCondition = new LocalTerm({
          data: [{ tripType, tC: [tC] }],
        });
  
        await newTermCondition.save();
  
        return res.status(201).json({
          success: true,
          message: "New term and condition record created",
          data: newTermCondition,
        });
      }
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  };
  

const getLocalTc = async (req, res, next) => {
    try {
  
  
      // Find the document and filter by tripType
      const termCondition = await LocalTerm.findOne();
  
      if (!termCondition) {
        return next(new AppError("No terms and conditions found", 404));
      }
  
    //   const specificTerm = termCondition.data.find(
    //     (item) => item.tripType === tripType
    //   );
  
    //   if (!specificTerm) {
    //     return next(new AppError(`No terms found for trip type: ${tripType}`, 404));
    //   }
  
      res.status(200).json({
        success: true,
        message: `Get ALL Term and condition`,
        data: termCondition,
      });
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  };
  


  const getSpecificTc = async (req, res, next) => {
    try {
      const { tripType } = req.body;
  
      if (!tripType) {
        return next(new AppError("TripType is required", 400));
      }
  
      // Find the document and filter by tripType
      const termCondition = await LocalTerm.findOne();
  
      if (!termCondition) {
        return next(new AppError("No terms and conditions found", 404));
      }
  
      const specificTerm = termCondition.data.find(
        (item) => item.tripType === tripType
      );
  
      if (!specificTerm) {
        return next(new AppError(`No terms found for trip type: ${tripType}`, 404));
      }
  
      res.status(200).json({
        success: true,
        message: `Terms for trip type: ${tripType}`,
        data: specificTerm,
      });
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  };

export {
    addLocalTC,
    getLocalTc,
    getSpecificTc
}