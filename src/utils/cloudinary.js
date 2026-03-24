import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {
    try {
        if(!filePath) return null; // Handle case where filePath is not provided
        const result = await cloudinary.uploader.upload(filePath, {resource_type: "auto"});
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Delete the file if Cloudinary upload fails to prevent leftover files
        fs.unlinkSync(filePath, (err) => {
            if (err) console.error("Error deleting file after Cloudinary failure:", err);
        }); 
        throw error;
    }
};

export { uploadToCloudinary };