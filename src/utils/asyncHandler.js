const asyncHandler1 = (requestHandler) => {
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>{next(err)})
    }
}

export {asyncHandler1}

//higher order functions - that accept and return the function

const asyncHandler = (fn) => async (req, res, next)=>{
    try{
        await fn(req, res, next)


    } catch(err){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}