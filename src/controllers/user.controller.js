import { asyncHandler1 } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user_model.js"
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler1(async(req, res)=>{
    const {fullName, email, userName, password} = req.body
    console.log(fullName, " ", email);

    if([fullName, email, userName, password].some((field)=> field?.trim() === "" )){
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = User.findOne({
        $or:[{ userName }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "Username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    const coverImagePath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatarResponse = await uploadCloudinary(avatarLocalPath);

    const coverResponse = await uploadCloudinary(coverImagePath);

    if(!avatarResponse){
        throw new ApiError(409, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatarResponse.url,
        coverImage:coverImagePath?.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })

    const check = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!check){
        throw new ApiError(500, "Can't register the user");
    }

    return res.status(201).json(
        new ApiResponse(200, check, "User created and registered successfully")
    )



    
})

export {registerUser}



// get user details
// validation - check if empty
// check if user already exists: for both username and email
// check for images, check for avatar
// upload them to cloudinary - extract url from response
// check if avatar is successfully uploaded on cloudinary or not
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return response 