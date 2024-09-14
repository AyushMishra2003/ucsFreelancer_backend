import mongoose from "mongoose";
import cloudinary from 'cloudinary'
import fs from 'fs'; // For file deletion if needed
import LocalCategoryModel from "../models/Local/LocalCategoryModel.js";
import airpotCategory from "../models/Airpot/AirpotCategoryModel.js";
mongoose.set('strictQuery',false)

const ConnectionToDB=async()=>{
    try{
    const {connection}=await mongoose.connect(
        process.env.MONGODB_URL
    )

    if(connection){
        console.log("Connected to Mongoo DB");
    }
   } catch(e){
    console.log(e);
    process.exit(1)
   }
}


// async function updateExistingCategories() {
//     try {
//       await ConnectionToDB();
  
//       const categories = await LocalCategoryModel.find({});
  
//       for (const category of categories) {
//         let updated = false;
  
//         // Check if photo field is missing and add default
//         if (!category.photo) {
//           const defaultImagePath = '/path/to/default/image.jpg'; // Replace with actual path
  
//           // Upload default image to Cloudinary
//         //   const result = await cloudinary.uploader.upload(defaultImagePath, {
//         //     folder: 'default_category_images',
//         //   });
  
//           category.photo = {
//             public_id: "",
//             secure_url: "",
//           };
//           updated = true;
  
//           // Optionally remove the local file after uploading to Cloudinary
//           fs.unlinkSync(defaultImagePath);
//         }
  
//         // Ensure numberOfSeats and numberOfBags are set
//         if (category.numberOfSeats === undefined) {
//           category.numberOfSeats = 0; // Default value
//           updated = true;
//         }
//         if (category.acAvailable === undefined) {
//           category.acAvailable = false; // Default value
//           updated = true;
//         }
//         if (category.numberOfBags === undefined) {
//           category.numberOfBags = 0; // Default value
//           updated = true;
//         }
  
//         // Save updated category
//         if (updated) {
//           await category.save();
//         }
//       }
  
//       console.log('Categories updated with new fields');
//     } catch (err) {
//       console.error('Error updating categories:', err);
//     } finally {
//       mongoose.connection.close();
//     }
//   }
  
//   updateExistingCategories();


// async function updateAirpotCategory() {
//     try {
//       // Establish connection to the database
//       await ConnectionToDB();
  
//       // Fetch all documents from the airpotCategory collection
//       const categories = await airpotCategory.find({});
  
//       // Loop through each category to check and update fields
//       for (const category of categories) {
//         let updated = false;
  
//         // Ensure the `photo` field exists and has default values if missing
//         if (!category.photo || !category.photo.public_id || !category.photo.secure_url) {
//           category.photo = {
//             public_id: "",
//             secure_url: "",
//           };
//           updated = true;
//         }
  
//         // Ensure `numberOfSeats` has a default value if missing
//         if (category.numberOfSeats === undefined) {
//           category.numberOfSeats = 3; // Default value
//           updated = true;
//         }
  
//         // Ensure `acAvailable` has a default value if missing
//         if (category.acAvailable === undefined) {
//           category.acAvailable = true; // Default value
//           updated = true;
//         }
  
//         // Ensure `numberOfBags` has a default value if missing
//         if (category.numberOfBags === undefined) {
//           category.numberOfBags = 2; // Default value
//           updated = true;
//         }
  
//         // Save the updated category if any field was modified
//         if (updated) {
//           await category.save();
//           console.log(`Category with id ${category._id} updated successfully.`);
//         }
//       }
  
//       console.log("All airpotCategory documents updated with default values.");
//     } catch (err) {
//       console.error("Error updating airpotCategory documents:", err);
//     } finally {
//       // Close the MongoDB connection
//       mongoose.connection.close();
//     }
//   }
  
  // Call the function to update `airpotCategory`
//   updateAirpotCategory();





export default ConnectionToDB