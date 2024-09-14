import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema(
    {   
        content:{
            type:String,
            required:true
        },
        videos:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }

    },{timestamps:true}
)

commentSchema.plugin(mongooseAggregatePaginate) // allow us to control how many we want to show on one page

export const Comment=mongoose.model("Comment",commentSchema)