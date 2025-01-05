import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import { db } from "../app.js";
import { allPhotoByAdminId, upload_func } from "../middleware/room_photo_uploads.js";
import { getAdminId } from "../middleware/userAuthentication.js";
import { MulterError } from "multer";
// create room ======================================================================
export const roomController = tryCatchFunction(async (req, res, next) => {
    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    const upload = upload_func(String(photo_url_id));
    upload(req, res, (err) => {
        const admin_ref_id = getAdminId(req, res, next);
        const { price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;
        if (!price || !rating || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules)
            return next(new ErrorHandler("please enter all fields", 400));
        const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,RATING,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        // values -----------------------------
        const values = [room_id, admin_ref_id, price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id];
        db.query(query, values, (err, result) => {
            if (err) {
                return next(new ErrorHandler(`Error is : ${err}`, 400));
            }
        });
        const files = req.files;
        if (err == 'MulterError: Unexpected field' || err == MulterError)
            return next(new ErrorHandler("One time you can uploads 10 photos", 404));
        if (err)
            return next(new ErrorHandler(`Could't upload, Please try again : ${err}`, 400));
        if (!files || files.length === 0)
            return next(new ErrorHandler("Please select at-least one photo", 400));
        const imgs = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`);
        res.status(201).json({
            room: values,
            imgs: imgs
        });
    });
});
// get admin rooms ===========================================================
export const getAdminRooms = tryCatchFunction(async (req, res, next) => {
    const AdminId = getAdminId(req, res, next);
    const query = `SELECT * FROM ROOMS WHERE ADMIN_REF_ID = ?`;
    db.query(query, AdminId, async (err, result) => {
        if (err || result.length == 0)
            return next(new ErrorHandler("Rooms Not Found ", 404));
        const allRooms = await Promise.all(result.map(async (room) => {
            const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);
            // console.log(photos);
            return [room, photos];
        }));
        res.status(200).json({
            success: true,
            rooms: allRooms
        });
    });
});
export const updateRoom = tryCatchFunction(async (req, res, next) => {
    const roomId = req.params.id;
    if (!roomId)
        return next(new ErrorHandler("Please provide Room Id", 404));
    const { price, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;
    const query = ` UPDATE rooms SET PRICE = ?,ROOM_STATUS = ?, BED = ?, BED_SIT = ?, TOILET = ?, BATHROOM = ?, FAN = ?, KITCHEN = ?, TABLE_CHAIR = ?, ALMIRA = ?, WATER_SUPPLY = ?, WATER_DRINK = ?, PARKING_SPACE = ?, WIFI = ?, ELLECTRICITY_BILL = ?, RULES = ? WHERE ROOM_ID = ? `;
    const value = [price, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, roomId];
    db.query(query, value, (err, result) => {
        if (err)
            return next(new ErrorHandler("Database update failed : " + err, 500));
        else {
            res.status(200).json({
                success: true,
                message: "Room updated seccessfully",
                room_data: value
            });
        }
    });
});
export const updatePhoto = tryCatchFunction(async (req, res, next) => {
    const photoId = req.params.id;
    if (!photoId)
        return next(new ErrorHandler("Please provide PhotoId", 400));
    const upload = upload_func(photoId);
    upload(req, res, (err) => {
        const files = req.files;
        if (err) {
            return next(new ErrorHandler("Error uploading file", 500));
        }
        if (!files || files.length === 0) {
            return next(new ErrorHandler("No files uploaded", 400));
        }
        const img = files.map((file) => {
            return `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photoId}/${encodeURIComponent(file.originalname)}`;
        });
        res.status(200).json({
            success: true,
            message: "Photo uploaded seccessfully",
            img: img
        });
    });
});
