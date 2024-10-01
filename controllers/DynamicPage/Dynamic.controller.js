import PageModel from "../../models/DynamicPage/Pages.model.js";
import SectionModel from "../../models/DynamicPage/Section.model.js";
import AppError from "../../utilis/error.utlis.js";
import cloudinary from "cloudinary";
import fs from "fs";
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
      photo: {
        public_id: "",
        secure_url: "",
      },
      children: [], // If no children provided, default to an empty array
    });

    if (req.file) {
      console.log("File Upload:", req.file);
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      if (result) {
        newSection.photo = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      }
      // Remove the file using fs.unlinkSync
      fs.unlinkSync(req.file.path); // Ensure correct file removal
    }

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
  console.log("Add children method called");
  const { id } = req.params;
  const { title, description } = req.body;

  // Create a new child object
  const newChild = {
    title: title,
    description: description,
    photo: {
      public_id: "",
      secure_url: "",
    },
  };

  console.log("New child:", newChild);

  try {
    // Check if the children array is empty or not
    const section = await SectionModel.findById(id); // Fetch the section to check children

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check the length of the children array
    // if (section.children.length === 0) {
    //   console.log("Children array is empty, adding the first child.");
    // } else {
    //   console.log("Children array is not empty, adding another child.");
    // }

    // Handle file upload if it exists
    if (req.file) {
      console.log("File Upload:", req.file);
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      console.log("Upload result:", result);

      if (result) {
        newChild.photo = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      }
      // Remove the file after upload
      fs.unlinkSync(req.file.path);
    }

    // Push the new child to the existing section's children array
    const updatedSection = await SectionModel.findByIdAndUpdate(
      id,
      { $push: { children: newChild } }, // Adding the new child
      { new: true } // Return the updated document
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found while updating",
      });
    }

    res.status(200).json({
      success: true,
      message: "Children added successfully!",
      section: updatedSection,
    });
  } catch (error) {
    console.error("Error adding children:", error);
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

const getAllPages = async (req, res, next) => {
  try {
    const allPages = await PageModel.find({});

    if (!allPages) {
      return next(new AppError("Pages Not Found", 400));
    }

    res.status(200).json({
      success: true,
      message: "All Pages",
      data: allPages,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const getSpecificSection = async (req, res) => {
  const { pageName, sectionTitle } = req.body; // Assuming you're passing the section title as a parameter

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

    // Find the specific section by its title (or you can modify this to search by _id)
    const section = page.sections.find((sec) => sec.title === sectionTitle);

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
      message: "Error fetching specific section",
      error: error.message,
    });
  }
};

export {
  createPage,
  createSection,
  getSectionsByPage,
  addChildrenToSection,
  getAllPages,
  getSpecificSection,
};
