import { asyncHandler1 } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user_model.js"
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { checkEmail } from "../utils/checkEmail.js";
import { deleteCloudinary } from "../utils/Deletecloudinary.js";
// import {jwt} from "jsonwebtoken"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
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
    // console.log(req.body);
    console.log(req);

    if([fullname, email, username, password].some((field)=> field?.trim() === "" )){
        throw new ApiError(400, "All fields are required");
    }

    if(!checkEmail(email)){
        throw new ApiError(400, "this is a wrong email");
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
    console.log(req)
    if(!(username || email)){
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
    console.log(res.cookie);

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
        $unset:{
            refreshToken:1
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

const refreshAccessToken = asyncHandler1(async(req, res)=>{
    const incomingRefreshToken=req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used");
        }
    
        const options={httpOnly:true, secure:true}
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken, newRefreshToken
            },"access token generated successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

const changeCurrentPassword = asyncHandler1(async(req, res)=>{
    const {oldPassword, newPassword}=req.body;
    
    const user=await User.findById(req.user?._id);
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(404, "Invalid password");
    }

    user.password = newPassword;
    
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200, "Password changed successfully"))

})

// make file updation a separate handler else it causes network congestion as it sends text data again as well
const updateAccountDetails = asyncHandler1(async(req, res)=>{
    const {fullname, email}=req.body;

    if(!fullname || !email){
        throw new ApiError(400, "Both fullname and email is required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        } // info after changing will be returned
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))



})


const getCurrentUser = asyncHandler1(async(req, res)=>{
    return res.status(200)
    .json(200, 
        req.user, 
        "Current user fetched successfully"
    )
})

const updateUserAvatar = asyncHandler1(async(req, res)=>{
    const avatarLocalPath = req.files?.avatar[0].path;
    console.log(req)
    // console.log(req.file)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const prevAvatarURL=req.user.avatar;

    const response = await deleteCloudinary(prevAvatarURL);

    if(!response){
        throw new ApiError(400, "Previous avatar can't deleted")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"))

})
const updateUserCoverImage = asyncHandler1(async(req, res)=>{
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover file is missing");
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const prevCoverUrl = req.user.coverImage;

    const response = await deleteCloudinary(prevCoverUrl);

    if(!response){
        throw new ApiError(500, "Previous cover image can't be deleted");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler1(async(req, res)=>{
    
    const {username} = req.params;

    if(!username?.trim){
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{ // counting subscribers 
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{ // counting how many subscribed to
                from:"subscriptions",
                localField:"_id",
                foreignField:"subcriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscibersCount:{
                    $size:"$subscribers"
                },
                channelsSubsribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscibersCount:1,
                channelsSubsribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }    
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel found")
    )
    
})

const getWatchHistory = asyncHandler1(async(req, res)=>{
    const user_id = req.user._id; // when getting from mongodb we get a string but in between mongoose convert it to an id


    // aggregation pipeline code is directly passed to mongodb 
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        }, 
        { // looking in videos 
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory,"Watch history successfully extracted"));

})


export {
    registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory
}