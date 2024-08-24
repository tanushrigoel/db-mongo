// require('dotenv').config({path: './env'})
import dotenv from "dotenv"


import mongoose from "mongoose";
// import {DB_NAME} from "./constants"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB()












// import express from "express"

// const app=express()

// ( async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(err)=>{
//             console.log("not able to connect");
//             throw err;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("PORT is listening on port ", process.env.PORT);
//         })
//     } catch(err){
//         console.error("Error",err);
//     }
// })()