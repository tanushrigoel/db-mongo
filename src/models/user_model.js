import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true // if we want to make this property searchable then it optimizes it
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    avatar:{
        type:String, // cloudinary service
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String, // password should be encrypted
        required:[true, 'Password is required'],
    },
    refreshToken:{
        type:String
    }
},
{
    timestamps:true
})

userSchema.pre("save", async function(next){ // can't use arrow functions here as they donot have access to this
    if(this.isModified("password")){ // only encrypt when password is changed

        this.password=await bcrypt.hash(this.password, 10)
        next();
    }
    else return next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,
        
    },process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}



export const User=new mongoose.model("User", userSchema);

// JWT is a bearer token - kind of key whichever user will send it i will send it the data