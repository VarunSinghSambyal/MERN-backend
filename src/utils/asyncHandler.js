
//Async handler is a middleware function that can be used to wrap asynchronous route handlers in Express.js. It helps to catch any errors that may occur during the execution of the asynchronous code and pass them to the next middleware (usually an error-handling middleware) without having to use try-catch blocks in every route handler. This can help to keep the code cleaner and more maintainable.

// here is an example of how you might implement an asyncHandler function for promises in Express.js:

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export { asyncHandler };


//Here's another example of how you might implement an asyncHandler function for Try catch blocks in Express.js:

// const asynchandler = (fn) => { async (req, res, next)=>{
//     try {
//         await fn(req, res, next);
//     }   
//     catch (error) {
//         res.status(500).json({ message: "An error occurred", error: error.message, success: false });
//         next(error);
//     }
// }}