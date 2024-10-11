// import in app.ts main server file
export const superErrorHandeler = (err, req, res, next) => {
    err.message = err.message || "Internal server error";
    err.statusCode = err.statusCode || 500;
    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
// Try Catch Function for use any function
export const tryCatchFunction = (customfunction) => (req, res, next) => {
    Promise.resolve(customfunction(req, res, next)).catch(next);
};
