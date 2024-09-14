import LocalTerm from "../../models/Local/LocalTermCondtion.js";
import AppError from "../../utilis/error.utlis.js";

// Add or update term and condition based on tripType and tcId
const addLocalTC = async (req, res, next) => {
  try {
    const { tripType, tC, tcId } = req.body;

    if (!tripType || !tC) {
      return next(new AppError("TripType and Term and Condition are required", 400));
    }

    // Find the single existing document
    let termCondition = await LocalTerm.findOne();

    console.log(termCondition);
    

    if (termCondition) {
      // Check if the tripType already exists in the data array
      const existingTripType = termCondition.data.find(
        (item) => item.tripType === tripType
      );

      if (existingTripType) {
        if (tcId) {
          // Update existing term and condition if tcId is provided
          const existingTC = existingTripType.tC.find((item) => item._id.toString() === tcId);
          
          if (existingTC) {
            existingTC.text = tC; // Update the type of the existing term
          } else {
            return next(new AppError(`No term found with ID: ${tcId}`, 404));
          }
        } else {
          // If tcId is not provided, add a new term and condition
          existingTripType.tC.push({ text: tC });
        }
      } else {
        // If tripType doesn't exist, add a new entry with tripType and tC array
        termCondition.data.push({ tripType, tC: [{ text: tC }] });
      }

      // Save the updated document
      await termCondition.save();

      return res.status(200).json({
        success: true,
        message: tcId
          ? `Term and condition with ID: ${tcId} updated for trip type: ${tripType}`
          : `New term and condition added for trip type: ${tripType}`,
        data: termCondition,
      });
    } else {
      // If no document exists, create a new one with the tripType and tC array
      const newTermCondition = new LocalTerm({
        data: [{ tripType, tC: [{ text: tC }] }],
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

// Get all terms and conditions
const getLocalTc = async (req, res, next) => {
  try {
    // Find the document with all terms and conditions
    const termCondition = await LocalTerm.findOne();

    if (!termCondition) {
      return next(new AppError("No terms and conditions found", 404));
    }

    res.status(200).json({
      success: true,
      message: "All terms and conditions",
      data: termCondition,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Get specific terms and conditions for a tripType or a specific tc by its ID
const getSpecificTc = async (req, res, next) => {
  try {
    const { tripType } = req.body;

    if (!tripType ) {
      return next(new AppError("TripType or tcId is required", 400));
    }

    // Find the document
    const termCondition = await LocalTerm.findOne();

    if (!termCondition) {
      return next(new AppError("No terms and conditions found", 404));
    }

    if (tripType) {
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
    } else if (tcId) {
      // If tcId is provided, find and return the specific term and condition
      let found = false;

      termCondition.data.forEach((item) => {
        const specificTc = item.tC.find((tc) => tc._id.toString() === tcId);

        if (specificTc) {
          found = true;
          return res.status(200).json({
            success: true,
            message: `Term and condition with ID: ${tcId}`,
            data: specificTc,
          });
        }
      });

      if (!found) {
        return next(new AppError(`No term found with ID: ${tcId}`, 404));
      }
    }
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export {
  addLocalTC,
  getLocalTc,
  getSpecificTc
};
