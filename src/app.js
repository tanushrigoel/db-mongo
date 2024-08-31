import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) // setting the limit for max json size

app.use(express.urlencoded({extended:true, limit:"16kb"})) // understanding the encoded urls like added %20 for space in url

app.use(express.static("public")) // for storing files, images

app.use(cookieParser())

import userRouter from './routes/user.routes.js'

app.use('/api/v1/users', userRouter)




export {app};