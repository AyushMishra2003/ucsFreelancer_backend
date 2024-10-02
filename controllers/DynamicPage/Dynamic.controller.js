import PageModel from "../../models/DynamicPage/Pages.model.js";
import SectionModel from "../../models/DynamicPage/Section.model.js";
import AppError from "../../utilis/error.utlis.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";
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
const createSection = async (req, res,next) => {
  const { title, description, page } = req.body;

  try {
    // Check if a section with the same title already exists
    let section = await SectionModel.findOne({ title });

    if (section) {
      // If the section exists, update the description and photo (if provided)
      section.description = description || section.description;

      // If a new file is uploaded, update the photo
      if (req.file) {
        console.log("File Upload:", req.file);

        // Normalize the path to avoid issues with backslashes on Windows
        const normalizedPath = path.resolve(req.file.path).replace(/\\/g, '/');

        const result = await cloudinary.v2.uploader.upload(normalizedPath, {
          folder: "lms",
        });

        if (result) {
          // Update the photo field with the new file's details
          section.photo = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }

        // Remove the file using fs.unlinkSync
        fs.unlinkSync(req.file.path); // Ensure correct file removal
      }

      // Save the updated section
      await section.save();

      res.status(200).json({
        success: true,
        message: "Section updated successfully!",
        section,
      });
    } else {
      // If no section with the given title exists, create a new one
      const newSection = new SectionModel({
        title,
        description,
        page,
        photo: {
          public_id: "",
          secure_url: "",
        },
        children: [], // Default to an empty array
      });

      // If a file is uploaded, upload it to Cloudinary
      if (req.file) {
        console.log("File Upload:", req.file);

        // Normalize the path to avoid issues with backslashes on Windows
        const normalizedPath = path.resolve(req.file.path).replace(/\\/g, '/');

        const result = await cloudinary.v2.uploader.upload(normalizedPath, {
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

      // Save the new section to the database
      await newSection.save();

      // Update the associated page with the new section
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
    }
  } catch (error) {
    console.log(error);
    
     return next(new AppError(error.message,500))
  }
};


const addChildrenToSection = async (req, res, next) => {
  console.log("Add children method called");
  const { id } = req.params; // Section ID
  const { title, description } = req.body;

  // New child object to be added/updated
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
    // Fetch the section by ID
    const section = await SectionModel.findById(id);

    // If the section doesn't exist, return 404
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Find if a child with the same title already exists
    const existingChildIndex = section.children.findIndex(
      (child) => child.title === title
    );

    if (existingChildIndex !== -1) {
      // Child with the same title exists, update its description and photo if applicable
      console.log("Updating existing child...");
      section.children[existingChildIndex].description =
        description || section.children[existingChildIndex].description;

      // Handle file upload if it exists
      if (req.file) {
        console.log("File Upload:", req.file);
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        console.log("Upload result:", result);

        // Update the photo field with the new file's details
        if (result) {
          section.children[existingChildIndex].photo = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }

        // Remove the file after upload
        fs.unlinkSync(req.file.path);
      }

      // Save the updated section
      await section.save();

      res.status(200).json({
        success: true,
        message: "Child updated successfully!",
        section,
      });
    } else {
      // If no child with the given title exists, add the new child to the array
      console.log("Adding new child...");

      // Handle file upload if it exists
      if (req.file) {
        console.log("File Upload:", req.file);
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        console.log("Upload result:", result);

        // Update the photo field with the new file's details
        if (result) {
          newChild.photo = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }

        // Remove the file after upload
        fs.unlinkSync(req.file.path);
      }

      // Add the new child to the children array
      section.children.push(newChild);

      // Save the updated section
      await section.save();

      res.status(200).json({
        success: true,
        message: "Child added successfully!",
        section,
      });
    }
  } catch (error) {
    console.error("Error adding/updating child:", error);
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
