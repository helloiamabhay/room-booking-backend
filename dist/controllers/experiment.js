import ErrorHandler from "../middleware/customError.js";
import { db } from "../app.js";
import { MulterError } from "multer";
import { getAdminId } from "../middleware/userAuthentication.js";
import { upload_func } from "../middleware/room_photo_uploads.js";
import { v4 as uuidv4 } from "uuid";
import { tryCatchFunction } from "../middleware/errorHandler.js";
export const testing0 = async (req, res, next) => {
    let latitude;
    let longitude;
    let address1;
    try {
        latitude = 26.420154;
        longitude = 82.527745;
        const geocoder = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const response = await fetch(geocoder);
        const data = await response.json();
        console.log(data);
        address1 = data.display_name;
        res.status(200).json({
            address: address1,
            cordinates: [latitude, longitude]
        });
    }
    catch (error) {
        next(new ErrorHandler("error", 400));
    }
};
export const testing = tryCatchFunction(async (req, res, next) => {
    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    const upload = upload_func(String(photo_url_id));
    upload(req, res, async (err) => {
        const admin_ref_id = getAdminId(req, res, next);
        const { price, address, latitude, longitude, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;
        let address0;
        try {
            // i have to take cordinates from frontend and fetch address
            if (latitude && longitude) {
                const geocoder = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                const response = await fetch(geocoder);
                const data = await response.json();
                address0 = data.display_name;
            }
            else {
                address0 = address;
            }
        }
        catch (error) {
            console.log("address not fetched by real location");
        }
        if (!price || address0 === undefined || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules)
            return next(new ErrorHandler("please enter all fields", 400));
        const values = [room_id, admin_ref_id, price, address0, latitude, longitude, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id];
        try {
            const connection = await db.getConnection();
            try {
                const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,ADDRESS,LATITUDE,LONGITUDE,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                connection.query(query, values);
                connection.release();
            }
            catch (error) {
                connection.release();
                return next(new ErrorHandler("Room not created Try again", 404));
            }
        }
        catch (error) {
            return next(new ErrorHandler("DB connection failed try again ", 404));
        }
        const files = req.files;
        if (err == 'MulterError: Unexpected field' || err == MulterError)
            return next(new ErrorHandler("One time you can uploads 10 photos", 404));
        if (err)
            return next(new ErrorHandler(`Could't upload, Please Try again`, 400));
        if (!files || files.length === 0)
            return next(new ErrorHandler("Please select at-least one photo", 404));
        const imgs = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`);
        res.status(201).json({
            room: values,
            imgs: imgs
        });
    });
});
