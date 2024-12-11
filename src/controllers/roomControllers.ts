import { NextFunction, query, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../app.js";
import { createRoomTypes } from "../types/types.js";
import { upload_func } from "../middleware/room_photo_uploads.js";
import { RowDataPacket } from "mysql2";
import { getAdminId } from "../middleware/userAuthentication.js";






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


    // admin id -------------------------------------------------------------------------

    const admin_ref_id = getAdminId(req, res, next)
    // console.log("admin id = " + admin_ref_id);


    // get photo id -------------------------------------------------------------------------
    function getPhotoUrl() {
        const query = 'SELECT PHOTO_URL_ID FROM ROOMS WHERE ADMIN_REF_ID = ?'
        return new Promise<RowDataPacket[]>((resolve, reject) => {
            db.query<RowDataPacket[]>(query, admin_ref_id, (err, result) => {
                if (err) {
                    return reject(`Error: ${err}`);
                }
                if (result.length === 0) {
                    return reject('No photo URL found for the given admin reference ID');
                }
                resolve(result[0].PHOTO_URL_ID);
            });
        })
    }

    const photo_url_id = await getPhotoUrl()
    // console.log("photo-id = " + photo_url_id);

    const upload = upload_func(String(photo_url_id));
    upload(req, res, (err) => {
        const files = req.files as Express.Multer.File[];
        if (err == 'MulterError: Unexpected field') return next(new ErrorHandler("One time you can uploads 10 photos", 404));
        if (err) return next(new ErrorHandler(`Could't upload, Please try again : ${err}`, 404));


        if (!files || files.length === 0) return next(new ErrorHandler("Please select at-least one photo", 404));



        const img = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`)

        res.status(200).json({
            success: true,
            img

        })

    })




})
