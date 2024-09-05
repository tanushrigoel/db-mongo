import { asyncHandler1 } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user_model.js"
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// writing async functions the better way
const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken};

    } catch(err){
        throw new ApiError(500, "not able to generate access token");
    }
}


const registerUser = asyncHandler1(async(req, res)=>{
    const {fullname, email, username, password} = req.body
    console.log(req.body);

    if([fullname, email, username, password].some((field)=> field?.trim() === "" )){
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or:[{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "Username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImagePath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImagePath=req.files.coverImage[0].path;
    }
    // console.log(req.files);
    

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatarResponse = await uploadCloudinary(avatarLocalPath);

    const coverResponse = await uploadCloudinary(coverImagePath);

    if(!avatarResponse){
        throw new ApiError(409, "Avatar is required");
    }

    const user = await User.create({
        fullname,
        avatar:avatarResponse.url,
        coverImage:coverResponse?.url || "",
        email,
        password,
        username:username.toLowerCase()
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


const loginUser=asyncHandler1(async(req, res)=>{
    const {username, email, password} = req.body;
    if(!username || !email){
        throw new ApiError(400, "username or email is required");
    }
    
    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // reading more about above two

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true
    } // now only server can modify them

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user:loggedInUser, accessToken, refreshToken
    },"User logged in successfully"
    ))

})

// get username or email, and password
// validation - check if empty
// check if username exists
// check if the password is the correct combination for username/email 
// if password is wrong generate access, refresh token
// send secure cookies
// login

const logoutUser = asyncHandler1(async(req, res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },{
        new:true
    })

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})






export {registerUser, loginUser, logoutUser}


