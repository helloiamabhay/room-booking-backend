import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "./errorHandler.js";
import ErrorHandler from "./customError.js";
import jwt, { JwtPayload } from "jsonwebtoken";



export const userAuthenticate = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

})

// get admin Id from cookie-------------------------------------------------
export const getAdminId = (req: Request, res: Response, next: NextFunction): string | void => {

    const token = req.cookies['adminAuthToken'];

    if (!token) return next(new ErrorHandler("Please Login before! ", 401))
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        const admin_ref_id = (decoded as JwtPayload).admin_id as string;
        return admin_ref_id
    } catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
}

// autherize the admin Loged-In or not -------------------------------
export const authAdmin = (req: Request, res: Response, next: NextFunction): string | void => {

    const token = req.cookies['adminAuthToken'];

    if (!token) return next(new ErrorHandler("Please Login before! ", 401))
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (decoded as JwtPayload).admin_id as string;
    } catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
    next()
}

export const authUser = (req: Request, res: Response, next: NextFunction): string | void => {

    const token = req.cookies['userAuthToken'];

    if (!token) return next(new ErrorHandler("Please SignUp Or Login! ", 401))
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (decoded as JwtPayload).userId as string;
    } catch {
        return next(new ErrorHandler("Invalid token. Please login !", 401));
    }
    next()
}
