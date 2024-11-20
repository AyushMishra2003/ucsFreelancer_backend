import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define upload directory
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Ensure uploads directory exists
}

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Set the destination to 'uploads/'
  },
  filename: (req, file, cb) => {
    // Add timestamp to the file name to ensure unique filenames
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Filter to allow only image file types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Only images are allowed (.jpg, .jpeg, .png, .webp, .avif)'), false);
  }
  cb(null, true);
};

// Set up multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB file size limit
});

export default upload;  // Export the multer configuration
