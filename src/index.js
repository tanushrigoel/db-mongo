// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import express from 'express'
import connectDB from "./db/index.js";
import {app} from './app.js' 

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("err",(err)=>{
        console.log(`App not able to connect on port ${process.env.PORT}`);
        throw err;        
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("MongoDB connection failed!!!!", err);
})












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