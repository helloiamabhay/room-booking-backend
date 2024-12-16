import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import { db } from "../app.js";
import { upload_func } from "../middleware/room_photo_uploads.js";
import { getAdminId } from "../middleware/userAuthentication.js";
// create room ======================================================================
export const roomController = tryCatchFunction(async (req, res, next) => {
    const { price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;
    if (!price || !rating || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules)
        return next(new ErrorHandler("please enter all fields", 400));
    const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,RATING,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    // admin id ----------------------
    const admin_ref_id = getAdminId(req, res, next);
    // values -----------------------------
    const values = [room_id, admin_ref_id, price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id];
    // insert data in db 
    db.query(query, values, (err, result) => {
        if (err)
            return next(new ErrorHandler(`Error is : ${err}`, 400));
        else {
            res.status(201).json({
                success: true,
                room_data: values
            });
        }
    });
});
// photo upload controller ====================================================================================
export const photoUploadController = tryCatchFunction(async (req, res, next) => {
    // admin id ----------------------------------
    const admin_ref_id = getAdminId(req, res, next);
    // get photo id ---------------------------------------
    function getPhotoUrl() {
        const query = 'SELECT PHOTO_URL_ID FROM ROOMS WHERE ADMIN_REF_ID = ?';
        return new Promise((resolve, reject) => {
            db.query(query, admin_ref_id, (err, result) => {
                if (err?.message == 'No photo URL found for the given admin reference ID') {
                    console.log("No photo URL found for the given admin reference ID");
                    return reject(`Error:`);
                }
                if (result.length === 0) {
                    return reject('No photo URL found for the given admin reference ID');
                }
                resolve(result[0].PHOTO_URL_ID);
            });
        });
    }
    let photo_url_id;
    try {
        photo_url_id = await getPhotoUrl();
    }
    catch (error) {
        console.log("this is error");
    }
    if (!photo_url_id)
        return next(new ErrorHandler("Please create room before", 404));
    // upload the images on aws s3 bucket
    const upload = upload_func(String(photo_url_id));
    upload(req, res, (err) => {
        const files = req.files;
        if (err == 'MulterError: Unexpected field')
            return next(new ErrorHandler("One time you can uploads 10 photos", 404));
        if (err)
            return next(new ErrorHandler(`Could't upload, Please try again : ${err}`, 400));
        if (!files || files.length === 0)
            return next(new ErrorHandler("Please select at-least one photo", 400));
        const img = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`);
        res.status(201).json({
            success: true,
            img
        });
    });
});
// get admin rooms ===========================================================
export const getAdminRooms = tryCatchFunction(async (req, res, next) => {
    try {
        const AdminId = getAdminId(req, res, next);
        const query = `SELECT * FROM ROOMS WHERE ADMIN_REF_ID = ?`;
        db.query(query, AdminId, (err, result) => {
            if (err)
                return next(new ErrorHandler("Rooms Not Found ", 400));
            const all_rooms = result.map((room) => {
                return [room, "https://abhayvsk.vercel.app"];
            });
            res.status(200).json({
                success: true,
                rooms: all_rooms
            });
        });
    }
    catch {
    }
});
// solve if not rooms have admins
