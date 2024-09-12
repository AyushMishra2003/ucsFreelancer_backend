import mongoose from "mongoose";
import cloudinary from 'cloudinary'
import fs from 'fs'; // For file deletion if needed
import LocalCategoryModel from "../models/Local/LocalCategoryModel.js";
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



export default ConnectionToDB