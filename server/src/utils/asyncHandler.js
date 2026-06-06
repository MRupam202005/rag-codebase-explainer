const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((error)=>next(error))
    }
} 

export { asyncHandler }










/*
// async handler is a higher-order function that is used to handle asynchronous operations in a more concise way 
// it is used to handle the asynchronous operations in a more concise way 

// const asyncHandler = ()=>{}               // void 
// const asyncHandler = (func)=>{ async ()=>{}} // function returning promise that return value as (=>{} or ()=>value)
// const asyncHandler = (func)=> async ()=>{}  // function returning promise that return value as (=>value) 
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("asyncHandlerError:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}
*/
