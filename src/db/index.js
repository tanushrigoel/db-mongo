import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


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