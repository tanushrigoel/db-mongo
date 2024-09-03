import { ApiError } from "../utils/ApiError";
import { asyncHandler1 } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user_model.js" 

export const verifyJWT = asyncHandler1(async(req, _, next)=>{
    try {
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decoded_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decoded_token).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "invalid access token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "invalid access token");
    }


})