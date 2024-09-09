import fs from "fs"

import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from "cloudinary-build-url";
import { ApiError } from "./ApiError.js";

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
})();

const deleteCloudinary = async function(imageUrl){
    const publicID = extractPublicId(imageUrl);

    if(!publicID){
        throw new ApiError(400, "Public ID can't be extracted");
    }

    const response = await cloudinary.uploader.destroy(publicID);

    if(!response){
        throw new ApiError(400, "Error while deleting file from cloudinary");
    }
    
    return response;
}

export {deleteCloudinary}