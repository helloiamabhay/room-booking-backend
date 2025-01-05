// import { NextFunction, Request, Response } from "express";
// import { tryCatchFunction } from "../middleware/errorHandler.js";
// import ErrorHandler from "../middleware/customError.js";
// import { db } from "../app.js";
// import { QueryResult, RowDataPacket } from "mysql2";
// import { upload_func } from "../middleware/room_photo_uploads.js";
export {};
// export const updatePhoto = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
//     const photoId = req.params.id
//     if (!photoId) return next(new ErrorHandler("Please provide PhotoId", 400))
//     const upload = upload_func(photoId)
//     upload(req, res, (err) => {
//         const files = req.files as Express.Multer.File[];
//         if (err) {
//             return next(new ErrorHandler("Error uploading file", 500));
//         }
//         if (!files || files.length === 0) {
//             return next(new ErrorHandler("No files uploaded", 400));
//         }
//         const img = files.map((file) => {
//             return `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photoId}/${encodeURIComponent(file.originalname)}`
//         })
//         res.status(200).json({
//             success: true,
//             message: "Photo uploaded seccessfully",
//             img: img
//         })
//     })
// })
