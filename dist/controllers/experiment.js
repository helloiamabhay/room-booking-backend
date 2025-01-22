import ErrorHandler from "../middleware/customError.js";
import { db } from "../app.js";
export const searching = async (req, res, next) => {
    const { price, address } = req.body;
    if (!price || !address)
        return next(new ErrorHandler("please enter all fields", 400));
    const values = [price, address];
    try {
        const connection = await db.getConnection();
        try {
            // take cordinates from frontend and add them to the query
            let user_latitude;
            let user_longitude;
            if (user_latitude && user_longitude) {
                const query = `SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance FROM  ROOMS WHERE  PRICE < ? AND ADDRESS LIKE '%?%' AND ROOM_STATUS=false ORDER BY distance`;
                const [rows] = await connection.query(query, values);
                res.send(rows);
            }
            else {
                const query = `SELECT * FROM ROOMS WHERE PRICE < ? AND ADDRESS = ? AND ROOM_STATUS=false`;
                const [rows] = await connection.query(query, values);
                res.send(rows);
            }
        }
        catch (error) {
        }
    }
    catch (error) {
    }
};
