// import { NextFunction, Request, Response } from "express";
// import { tryCatchFunction } from "../middleware/errorHandler.js";
// import { createRoomTypes } from "../types/types.js";
// import { v4 as uuidv4 } from "uuid";
// import ErrorHandler from "../middleware/customError.js";
// import { getAdminId } from "../middleware/userAuthentication.js";
// import { db } from "../app.js";
// import { upload_func } from "../middleware/room_photo_uploads.js";
// import { MulterError } from "multer";
export {};
// export const createRoomAndUploadPhoto = tryCatchFunction(async (req: Request<{}, {}, createRoomTypes>, res: Response, next: NextFunction) => {
//     const room_id = uuidv4();
//     const photo_url_id = uuidv4();
//     const upload = upload_func(String(photo_url_id));
//     upload(req, res, (err) => {
//         const admin_ref_id = getAdminId(req, res, next)
//         const { price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body
//         if (!price || !rating || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules) return next(new ErrorHandler("please enter all fields", 400));
//         const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,RATING,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES
//     (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
//         // values -----------------------------
//         const values = [room_id, admin_ref_id, price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id]
//         db.query(query, values, (err, result) => {
//             if (err) {
//                 return next(new ErrorHandler(`Error is : ${err}`, 400))
//             }
//         })
//         const files = req.files as Express.Multer.File[];
//         if (err == 'MulterError: Unexpected field' || err == MulterError) return next(new ErrorHandler("One time you can uploads 10 photos", 404));
//         if (err) return next(new ErrorHandler(`Could't upload, Please try again : ${err}`, 400));
//         if (!files || files.length === 0) return next(new ErrorHandler("Please select at-least one photo", 400));
//         const imgs = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`)
//         res.status(201).json({
//             room: values,
//             imgs: imgs
//         })
//     })
// })
