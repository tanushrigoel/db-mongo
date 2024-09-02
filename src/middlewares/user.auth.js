import { ApiError } from "../utils/ApiError";
import { asyncHandler1 } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user_model.js" 

export const verifyJWT = asyncHandler1(async(req, res, next)=>{

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

    if(!token){
        throw new ApiError(401, "Unauthorized request");
    }

    const decoded_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    await User.findById()


})