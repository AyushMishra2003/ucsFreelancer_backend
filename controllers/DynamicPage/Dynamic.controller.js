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
const createSection = async (req, res, next) => {
  const { title, description, page,meta_description,meta_title,meta_url } = req.body;

  try {
    // Check if a section with the same title already exists
    const sectionExists = await SectionModel.findOne({ title });
    
    if (sectionExists) {
      return res.status(400).json({
        success: false,
        message: "Section with this title already exists.",
      });
    }

    // Create a new section
    const newSection = new SectionModel({
      title,
      description,
      page,
      photo: {
        public_id: "",
        secure_url: "",
      },
      meta_description,
      meta_title,
      meta_url,
      children: [], // Default to an empty array
    });

    // If a file is uploaded, upload it to Cloudinary
    if (req.file) {
      console.log("File Upload:", req.file);

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

      fs.unlinkSync(req.file.path); // Ensure correct file removal
    }

    // Save the new section to the database
    await newSection.save();

    // Update the associated page with the new section
    await PageModel.findOneAndUpdate(
      { name: page },
      { $push: { sections: newSection._id } }, 
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Section created successfully!",
      section: newSection,
    });
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, 500));
  }
};

const updateSection = async (req, res, next) => {
  const { title, description,oldtitle ,meta_description,meta_title,meta_url} = req.body;


  console.log(oldtitle);
  
  const { sectionId } = req.params;


  

  try {
    // Find the section by ID
     let section=await SectionModel.find({})

    //  console.log(section);
     
   section = await SectionModel.findOne({title:oldtitle});

   

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Update title, description, and photo if provided
    section.title = title || section.title;
    section.description = description || section.description;
    section.meta_description=meta_description || section.meta_description;
    section.meta_title=meta_title || section.meta_title;
    section.meta_url=meta_url || section.meta_url;

    if (req.file) {
      console.log("File Upload:", req.file);

      const normalizedPath = path.resolve(req.file.path).replace(/\\/g, '/');
      const result = await cloudinary.v2.uploader.upload(normalizedPath, {
        folder: "lms",
      });

      if (result) {
        section.photo = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      }

      fs.unlinkSync(req.file.path);
    }

    // Save the updated section
    await section.save();

    res.status(200).json({
      success: true,
      message: "Section updated successfully!",
      section,
    });
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, 500));
  }
};



// Function to add a new child to a section
const addChildrenToSection = async (req, res, next) => {
  console.log("Add child method called");
  const { id } = req.params; // Section ID
  const { title, description,meta_description,meta_title,meta_url } = req.body;

  const newChild = {
    title: title,
    description: description,
    photo: {
      public_id: "",
      secure_url: "",
    },
    meta_description,
    meta_title,
    meta_url
  };

  try {
    // Fetch the section by ID
    const section = await SectionModel.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check if a child with the same title already exists
    const existingChild = section.children.find((child) => child.title === title);

    if (existingChild) {
      return res.status(400).json({
        success: false,
        message: "A child with this title already exists. Use the update function instead.",
      });
    }

    // Handle file upload if it exists
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      if (result) {
        newChild.photo = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      }

      fs.unlinkSync(req.file.path); // Remove the file after upload
    }

    section.children.push(newChild);
    await section.save();

    res.status(200).json({
      success: true,
      message: "Child added successfully!",
      section,
    });
  } catch (error) {
    console.error("Error adding child:", error);
    return next(new AppError(error.message, 500));
  }
};

// Function to update an existing child in a section
const updateChildInSection = async (req, res, next) => {

  const { id } = req.params; // Section ID

  const { childId,title, description,oldTitle,meta_description,meta_title,meta_url } = req.body; // Include childId to identify the child



  

  try {
    // Fetch the section by ID
    const section = await SectionModel.findById(id);

   
    

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Find the child by its ID
    const child = section.children.find((child) => child.title === oldTitle);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Update child properties
    if (title) child.title = title;
    if (description) child.description = description;

    if(meta_description) child.meta_description=meta_description;

    if(meta_title) child.meta_title=meta_title;

    if(meta_url) child.meta_url=meta_url;

    // Handle file upload if it exists
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      if (result) {
        child.photo = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
      }

      fs.unlinkSync(req.file.path); // Remove the file after upload
    }

    await section.save();

    res.status(200).json({
      success: true,
      message: "Child updated successfully!",
      section,
    });
  } catch (error) {
    console.error("Error updating child:", error);
    return next(new AppError(error.message, 500));
  }
};


// Controller to fetch all sections for a specific page
const getSectionsByPage = async (req, res) => {
  const { pageName } = req.params;
  console.log(pageName);
  
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

    console.log(page.sections);
    

    res.status(200).json({
      success: true,
      sections: page.sections,
    });
  } catch (error) {
    console.log(error);
    
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

  console.log(req.body);
  

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

    // console.log(section);
    

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


const getSectionChildByTitle = async (req, res) => {
  const { pageName, childTitle } = req.params;
  console.log(`Page: ${pageName}, Child Title: ${childTitle}`);

  

  try {
    // Find the section by page name
    const section = await SectionModel.findOne({ page: pageName });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Page section not found",
      });
    }

    // Filter the specific child by title
    const child = section.children.find(child => child.title === childTitle);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found in this section",
      });
    }

  
    

    res.status(200).json({
      success: true,
      message:"data are",
      data:child
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error fetching child from section",
      error: error.message,
    });
  }
};



export {
  createPage,
  createSection,
  getSectionsByPage,
  addChildrenToSection,
  updateChildInSection,
  updateSection,
  getAllPages,
  getSpecificSection,
  getSectionChildByTitle
};
