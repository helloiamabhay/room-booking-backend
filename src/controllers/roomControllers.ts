import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../app.js";
import { createRoomTypes } from "../types/types.js";
import { upload } from "../middleware/room_photo_uploads.js";



export const roomController = tryCatchFunction(async (req: Request<{}, {}, createRoomTypes>, res: Response, next: NextFunction) => {

    const { price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;

    if (!price || !rating || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules) return next(new ErrorHandler("please enter all fields", 400));

    const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,RATING,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`

    const room_id = uuidv4();
    const photo_url_id = uuidv4();



    // admin id --------------------------------------------------------------------------
    const token = req.cookies['adminAuthToken'];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const admin_ref_id = (decoded as JwtPayload).adminId as string;
    console.log(admin_ref_id);

    // values -------------------------------------------------------------------------------
    const values = [room_id, admin_ref_id, price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id]

    db.query(query, values, (err, result) => {
        if (err) return next(new ErrorHandler(`Error is : ${err}`, 404));
        else {
            res.status(200).json({
                success: true,
                room_data: values
            })
        }
    })

    // upload photo

})


export const photoUploadController = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
        if (err) return next(new ErrorHandler(`file uploading error: ${err}`, 404));

        const files = req.files as Express.Multer.File[];

        if (!req.files || files.length === 0) return next(new ErrorHandler("Please select at-least one photo", 404));

        if (files.length > 10) return next(new ErrorHandler("One time you can uploads 10 photos", 404));

        const img = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/${file.originalname}`)

        res.status(200).json({
            success: true,
            img

        })

    })




})
