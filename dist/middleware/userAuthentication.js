import { tryCatchFunction } from "./errorHandler.js";
import ErrorHandler from "./customError.js";
import jwt from "jsonwebtoken";
export const userAuthenticate = tryCatchFunction(async (req, res, next) => {
});
export const getAdminId = (req, res, next) => {
    const token = req.cookies['adminAuthToken'];
    if (!token)
        return next(new ErrorHandler("Please Login before! ", 404));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin_ref_id = decoded.adminId;
        return admin_ref_id;
    }
    catch {
        return next(new ErrorHandler("Invalid token. Please login again!", 401));
    }
};
