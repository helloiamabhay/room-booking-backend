import { tryCatchFunction } from "./errorHandler.js";
import ErrorHandler from "./customError.js";
import jwt from "jsonwebtoken";
export const userAuthenticate = tryCatchFunction(async (req, res, next) => {
});
// get admin Id from cookie-------------------------------------------------
export const getAdminId = (req, res, next) => {
    const token = req.cookies['adminAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please Login before! ", 401));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin_ref_id = decoded.admin_id;
        return admin_ref_id;
    }
    catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
};
// get user id from cookie-------------------------------------------
export const getUserId = (req, res, next) => {
    const token = req.cookies['userAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please Login before! ", 401));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decoded.userId;
        return user_id;
    }
    catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
};
// autherize the admin Loged-In or not -------------------------------
export const authAdmin = (req, res, next) => {
    const token = req.cookies['adminAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please Login before! ", 401));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        decoded.admin_id;
    }
    catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
    next();
};
export const authAdminCheck = (req, res, next) => {
    const token = req.cookies['adminAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please Login before! ", 401));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        decoded.admin_id;
        res.status(200).json({
            success: true,
            message: "Admin logged in"
        });
    }
    catch (error) {
        console.error("Authentication error:", error);
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
};
export const authUser = (req, res, next) => {
    const token = req.cookies['userAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please SignUp Or Login! ", 401));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        decoded.userId;
        res.status(200).json({
            success: true,
            message: "User logged in"
        });
    }
    catch {
        return next(new ErrorHandler("Invalid token. Please login !", 401));
    }
    next();
};
