import { NextFunction, Request, Response } from "express";
import ErrorHandler from "./customError.js";
// import in app.ts main server file
export const superErrorHandeler = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {

    err.message = err.message || "Internal server error";
    err.statusCode = err.statusCode || 500;

    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}
// Try Catch Function for use any function
export const tryCatchFunction = (customfunction: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(customfunction(req, res, next)).catch(next);
}
