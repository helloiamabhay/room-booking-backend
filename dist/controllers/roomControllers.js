import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { db } from "../app.js";
export const roomController = tryCatchFunction(async (req, res, next) => {
    const { price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body;
    if (!price || !rating || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules)
        return next(new ErrorHandler("please enter all fields", 400));
    const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,RATING,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    // admin id --------------------------------------------------------------------------
    const token = req.cookies['adminAuthToken'];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin_ref_id = decoded.adminId;
    console.log(admin_ref_id);
    // values -------------------------------------------------------------------------------
    const values = [room_id, admin_ref_id, price, rating, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id];
    db.query(query, values, (err, result) => {
        if (err)
            return next(new ErrorHandler(`Error is : ${err}`, 404));
        else {
            res.status(200).json({
                success: true,
                room_data: values
            });
        }
    });
});
