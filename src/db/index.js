import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

// always use async await for db and try catch as well

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected!! DB host: ${connectionInstance.connection.host}`);
        
    } catch(err){
        console.log("MONGODB not able to connect ", err);
        process.exit(1);
    }
}
export default connectDB;