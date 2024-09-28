import PageModel from "../../models/DynamicPage/Pages.model.js";
import SectionModel from "../../models/DynamicPage/Section.model.js";
import AppError from "../../utilis/error.utlis.js";

// Controller to create a new page
const createPage = async (req, res) => {
  const { name } = req.body;

  try {
    const newPage = new PageModel({ name });
    await newPage.save();

    res.status(201).json({
      success: true,
      message: "Page created successfully!",
      page: newPage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating page",
      error: error.message,
    });
  }
};

// Controller to create a new section
const createSection = async (req, res) => {
  const { title, description, page } = req.body;

  try {
    // Create a new section with optional children
    const newSection = new SectionModel({
      title,
      description,
      page,
      children: [], // If no children provided, default to an empty array
    });

    // Save the section to the database
    await newSection.save();

    await PageModel.findOneAndUpdate(
      { name: page },
      { $push: { sections: newSection._id } }, // Push the section ID to the sections array
      { new: true }
    );

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
    const updatedSection = await SectionModel.findByIdAndUpdate(
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

// Controller to fetch all sections for a specific page
const getSectionsByPage = async (req, res) => {
  const { pageName } = req.params;

  try {
    // Find the page by its name
    const page = await PageModel.findOne({ name: pageName }).populate(
      "sections"
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    res.status(200).json({
      success: true,
      sections: page.sections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sections for page",
      error: error.message,
    });
  }
};

// Additional controllers remain unchanged...

export { createPage, createSection, getSectionsByPage, addChildrenToSection };
