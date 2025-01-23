import ErrorHandler from "../middleware/customError.js";
import { db } from "../app.js";
import { tryCatchFunction } from "../middleware/errorHandler.js";
export const searching = tryCatchFunction(async (req, res, next) => {
    const { locality, district, price } = req.body;
    if (!price)
        return next(new ErrorHandler("Please Enter Price", 404));
    if (!locality && !district)
        return next(new ErrorHandler("Please Enter Lcality or Aria Name or District", 404));
    let latitude;
    let longitude;
    if (latitude && longitude) {
        const query = `SELECT *,(6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))+ SIN(RADIANS(?)) * SIN(RADIANS(latitude)) )) AS distance FROM ROOMS WHERE PRICE < ? AND LOCALITY = ? OR DISTRICT = ? AND ROOM_STATUS = "false" ORDER BY distance ;`;
        const connection = await db.getConnection();
        try {
            const value = [latitude, longitude, latitude, price, locality, district];
            const [rooms] = await connection.query(query, value);
            connection.release();
            // add distance in future in km. because time complexity increase if add distnce in room by map method also debug onle with cordinates rows
            res.status(200).json({
                success: true,
                room: rooms
            });
        }
        catch (error) {
            connection.release();
            return next(new ErrorHandler("Failed to fetch Rooms", 400));
        }
    }
    else {
        const connection = await db.getConnection();
        try {
            const query = `SELECT * FROM ROOMS WHERE PRICE < ? AND LOCALITY = ? OR DISTRICT = ? AND ROOM_STATUS = "false";`;
            const value = [price, locality, district];
            const [rooms] = await connection.query(query, value);
            connection.release();
            res.status(200).json({
                success: true,
                rooms: rooms
            });
        }
        catch (error) {
            connection.release();
            return next(new ErrorHandler("Failed to fetch Rooms", 400));
        }
    }
});
