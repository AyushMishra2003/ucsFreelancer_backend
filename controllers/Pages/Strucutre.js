import commonModel from "../../models/CommonStrcuture/common.strcuture.js";
import AppError from "../../utilis/error.utlis.js";

// Controller to create a new section
const createSection = async (req, res) => {
  const { title, description, page, children } = req.body;

  try {
    // Create a new section with optional children
    const newSection = new commonModel({
      title,
      description,
      page,
      children: children || [], // If no children provided, default to an empty array
    });

    // Save the section to the database
    await newSection.save();

    res.status(201).json({
      success: true,
      message: "Section created successfully!",
      section: newSection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating section",
      error: error.message,
    });
  }
};

// Controller to fetch all sections for a specific page
const getSectionsByPage = async (req, res) => {
  const { page } = req.params;

  try {
    // Find all sections for the specific page (e.g., home, about, services)
    const sections = await commonModel.find({ page });

    res.status(200).json({
      success: true,
      sections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sections for page",
      error: error.message,
    });
  }
};

// Controller to fetch a section by its ID
const getSectionById = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the section by its ID
    const section = await commonModel.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      section,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching section",
      error: error.message,
    });
  }
};

// Controller to add children to an existing section
const addChildrenToSection = async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const children = [
    {
      title: title,
      description: description,
    },
  ];

  console.log(children);

  try {
    // Push new children to the existing section
    const updatedSection = await commonModel.findByIdAndUpdate(
      id,
      { $push: { children: { $each: children } } }, // Adds multiple children
      { new: true } // Return the updated document
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Children added successfully!",
      section: updatedSection,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// Controller to update a section (title, description, or children)
const updateSection = async (req, res) => {
  const { id } = req.params;
  const { title, description, children } = req.body;

  try {
    // Update the section's details
    const updatedSection = await commonModel.findByIdAndUpdate(
      id,
      { title, description, children },
      { new: true } // Return the updated document
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Section updated successfully!",
      section: updatedSection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating section",
      error: error.message,
    });
  }
};

export {
  createSection,
  getSectionsByPage,
  getSectionById,
  addChildrenToSection,
  updateSection,
};
