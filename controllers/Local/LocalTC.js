import LocalTerm from "../../models/Local/LocalTermCondtion.js";
import AppError from "../../utilis/error.utlis.js";

// Add or update term and condition based on tripType and tcId
const addLocalTC = async (req, res, next) => {
  try {
    const { tripType, tC, tcId } = req.body;

    console.log(tripType,tC);
    

    if (!tripType || !tC) {
      return next(new AppError("TripType and Term and Condition are required", 400));
    }

    // Find the single existing document
    let termCondition = await LocalTerm.findOne();

    console.log(termCondition);
    


    

    if (termCondition) {
      console.log("ayush mishra");
      
      // Check if the tripType already exists in the data array
      const existingTripType = termCondition.data.find(
        (item) => item.tripType === tripType
      );

      if (existingTripType) {
        console.log(existingTripType);
        
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
          console.log(existingTripType);
          
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

      console.log("add term and condit0");
      

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

const deleteSpecificTc = async (req, res, next) => {
  try {
    const { tripType, tcId } = req.body;

    // Check if at least one of the required parameters is provided
    if (!tripType && !tcId) {
      return next(new AppError("Either tripType or tcId is required", 400));
    }

    // Find the document containing terms and conditions
    const termCondition = await LocalTerm.findOne();

    if (!termCondition) {
      return next(new AppError("No terms and conditions found", 404));
    }

    let found = false;

    // Check if tripType is provided, and locate it
    if (tripType) {
      const termIndex = termCondition.data.findIndex((item) => item.tripType === tripType);

      if (termIndex === -1) {
        return next(new AppError(`No terms found for trip type: ${tripType}`, 404));
      }

      // Check if tcId is also provided to delete a specific term within tripType
      if (tcId) {
        const tcList = termCondition.data[termIndex].tC;
        const tcIndex = tcList.findIndex((tc) => tc._id.toString() === tcId);

        if (tcIndex !== -1) {
          tcList.splice(tcIndex, 1); // Remove specific term by ID
          found = true;
        } else {
          return next(new AppError(`No term found with ID: ${tcId} under trip type: ${tripType}`, 404));
        }
      } else {
        // If no tcId is provided, delete all terms under this tripType
        termCondition.data.splice(termIndex, 1);
        found = true;
      }
    } else if (tcId) {
      // If only tcId is provided, search for it across all trip types
      termCondition.data.forEach((item) => {
        const tcIndex = item.tC.findIndex((tc) => tc._id.toString() === tcId);

        if (tcIndex !== -1) {
          item.tC.splice(tcIndex, 1); // Remove specific term by ID
          found = true;
          return; // Exit forEach loop after deleting
        }
      });

      if (!found) {
        return next(new AppError(`No term found with ID: ${tcId}`, 404));
      }
    }

    // Save the updated document if any deletion occurred
    if (found) {
      await termCondition.save();
      return res.status(200).json({
        success: true,
        message: "Term and condition deleted successfully",
      });
    } else {
      return next(new AppError("No matching terms found to delete", 404));
    }
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


const editTC = async (req, res, next) => {
  try {
    const { tripType, tcId, tC } = req.body;

    console.log(req.body);
    

    // Check for required parameters
    if (!tripType || !tcId || !tC) {
      return next(new AppError("TripType, Term and Condition ID, and Term and Condition are required", 400));
    }

    // Find the single existing document
    let termCondition = await LocalTerm.findOne();

    if (!termCondition) {
      return next(new AppError("No terms and conditions found", 404));
    }

    // Find the trip type entry
    const existingTripType = termCondition.data.find(item => item.tripType === tripType);

    if (!existingTripType) {
      return next(new AppError(`No terms found for trip type: ${tripType}`, 404));
    }

    // Find the term condition by ID
    const existingTC = existingTripType.tC.find(item => item._id.toString() === tcId);

    if (!existingTC) {
      return next(new AppError(`No term found with ID: ${tcId}`, 404));
    }

    // Update the term condition text
    existingTC.text = tC;

    // Save the updated document
    await termCondition.save();

    return res.status(200).json({
      success: true,
      message: `Term and condition with ID: ${tcId} updated for trip type: ${tripType}`,
      data: termCondition,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};





export {
  addLocalTC,
  getLocalTc,
  getSpecificTc,
  deleteSpecificTc,
  editTC
};
