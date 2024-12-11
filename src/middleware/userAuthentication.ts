import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "./errorHandler.js";
import ErrorHandler from "./customError.js";
import jwt, { JwtPayload } from "jsonwebtoken";



export const userAuthenticate = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

})

export const getAdminId = (req: Request, res: Response, next: NextFunction): string | void => {

    const token = req.cookies['adminAuthToken'];



    if (!token) return next(new ErrorHandler("Please Login before! ", 404))
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        const admin_ref_id = (decoded as JwtPayload).adminId as string;
        return admin_ref_id
    } catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
}