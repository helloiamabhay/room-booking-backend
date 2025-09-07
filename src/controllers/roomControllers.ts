import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import { dataCache, db, userS3 } from "../app.js";
import { createRoomTypes, searchingRoomsTypes } from "../types/types.js";
import { allPhotoByAdminId, upload_func } from "../middleware/room_photo_uploads.js";
import { RowDataPacket } from "mysql2";
import { getAdminId } from "../middleware/authentication.js";
import { MulterError } from "multer";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getDistance } from "geolib";


// create room ======================================================================

export const roomController = tryCatchFunction(async (
    req: Request<{}, {}, createRoomTypes>,
    res: Response,
    next: NextFunction
) => {
    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    const upload = upload_func(String(photo_url_id));

    upload(req, res, async (err) => {
        if (err instanceof MulterError) {
            return next(new ErrorHandler("One time you can upload max 10 photos", 400));
        }
        if (err) {
            return next(new ErrorHandler("Couldn't upload, please try again", 400));
        }

        const admin_ref_id = getAdminId(req, res, next);
        if (!admin_ref_id) {
            return next(new ErrorHandler("Admin not authorized", 403));
        }

        const {
            price, room_no, locality, district, latitude, longitude, room_type, gender,
            bed_sit, ac, toilet, bathroom, fan, kitchen,
            water_supply, water_drink, parking_space, wifi, ellectricity_bill,
            discription, rules
        } = req.body;



        if (
            !price || !room_no || !locality || !district || !room_type || !gender ||
            !bed_sit || !ac || !toilet || !bathroom || !fan || !kitchen || !water_supply || !water_drink || !parking_space || !wifi ||
            !ellectricity_bill || !rules || !discription
        ) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }

        const availability_date = new Date().toISOString().split("T")[0];
        const values = [
            room_id,
            admin_ref_id,
            price,
            room_no,
            locality,
            district,
            latitude || null,
            longitude || null,
            0.0,
            0,
            availability_date,
            room_type,
            gender,
            bed_sit,
            ac,
            toilet,
            bathroom,
            fan,
            kitchen,
            water_supply,
            water_drink,
            parking_space,
            wifi,
            ellectricity_bill,
            discription,
            rules,
            photo_url_id
        ];


        try {
            const connection = await db.getConnection();
            try {

                await connection.beginTransaction();

                const roomInsertQuery = `
          INSERT INTO ROOMS (
            ROOM_ID, ADMIN_REF_ID, PRICE,ROOM_NO, LOCALITY, DISTRICT, LATITUDE, LONGITUDE,
            RATING, RATING_COUNT_USER,
            AVAILABILITYDATE, ROOM_TYPE, GENDER,
            BED_SIT, AC, TOILET, BATHROOM, FAN, KITCHEN,
            WATER_SUPPLY, WATER_DRINK, PARKING_SPACE, WIFI, ELECTRICITY_BILL,
            DISCRIPTION, RULES, PHOTO_URL_ID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                await connection.query(roomInsertQuery, values);

                const bookingInsertQuery = `INSERT INTO BOOKINGS (BOOKING_ID,ADMIN_REF_ID,ROOM_ID,ROOM_NO,PRICE,AVAILABILITY_DATE) VALUES (?,?,?,?,?,?)`

                const bookingValues = [
                    uuidv4(),
                    admin_ref_id,
                    room_id,
                    room_no,
                    price,
                    availability_date
                ];
                await connection.query(bookingInsertQuery, bookingValues);

                const files = req.files as Express.Multer.File[];
                if (!files || files.length === 0) {
                    return next(new ErrorHandler("Please select at least one photo", 400));
                }
                await connection.commit();
                connection.release();
                dataCache.del("search-rooms");
                dataCache.del("admin-rooms");
                const imgs = files.map(file =>
                    `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`
                );

                res.status(201).json({
                    room: {
                        room_id,
                        admin_ref_id,
                        price,
                        room_no,
                        locality,
                        district,
                        latitude,
                        longitude,
                        availability_date,
                        room_type,
                        bed_sit,
                        ac,
                        toilet,
                        bathroom,
                        fan,
                        kitchen,
                        water_supply,
                        water_drink,
                        parking_space,
                        wifi,
                        ellectricity_bill,
                        rules,
                        discription,
                        photo_url_id,
                        rating: 0.0,
                        rating_count_user: 0
                    },
                    imgs
                });

            } catch (error) {
                await connection.rollback();
                connection.release();
                return next(new ErrorHandler(`Room not created, Try again: ${error}`, 500));
            }
        } catch (error) {
            console.error("DB connection error:", error);
            return next(new ErrorHandler("Database connection failed, try again", 500));
        }

    });
});




// get admin rooms ===========================================================
// check this API
export const getAdminRooms = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const AdminId = getAdminId(req, res, next);
    const query = `SELECT * FROM ROOMS WHERE ADMIN_REF_ID = ?`

    try {
        // check data is cached or not ==================
        if (dataCache.has("admin-rooms")) {
            const rooms = JSON.parse(dataCache.get("admin-rooms") as string)
            res.status(200).json({
                success: true,
                rooms: rooms
            })
        } else {
            const connection = await db.getConnection()
            try {
                const [rows] = await connection.query<RowDataPacket[]>(query, AdminId)
                connection.release()

                const allRooms = await Promise.all(rows.map(async (room) => {
                    const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);
                    return { room, photos }
                }))
                // set data in cache for 60 sec ========================
                dataCache.set("admin-rooms", JSON.stringify(allRooms), 60)
                res.status(200).json({
                    success: true,
                    rooms: allRooms
                })

            } catch (error) {
                connection.release()
                return next(new ErrorHandler("Rooms Not Found Try again", 404))
            }
        }
    } catch (error) {
        return next(new ErrorHandler("Failed to connect database", 500))
    }
})


export const updateRoom = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    const roomId = req.params.id
    if (!roomId) return next(new ErrorHandler("Please provide Room Id", 404));

    const { price, room_no, locality, district, latitude, longitude, room_type, gender, bed_sit, ac, toilet, bathroom, fan, kitchen, water_supply, water_drink, parking_space, wifi, ellectricity_bill, discription, rules } = req.body

    const query = ` UPDATE rooms SET PRICE = ?, ROOM_NO = ?, LOCALITY= ?, DISTRICT = ?, LATITUDE = ?, LONGITUDE = ?, ROOM_TYPE = ?, GENDER = ?, BED_SIT = ?, AC = ?, TOILET = ?, BATHROOM = ?, FAN = ?, KITCHEN = ?, WATER_SUPPLY = ?, WATER_DRINK=?,PARKING_SPACE=?,WIFI=?,ELECTRICITY_BILL=?,DISCRIPTION=?,RULES=? WHERE ROOM_ID = ? `;

    const bookingQuery = `UPDATE BOOKINGS SET ROOM_NO=?,PRICE=? WHERE ROOM_ID=?`

    const value = [price, room_no, locality, district, latitude, longitude, room_type, gender, bed_sit, ac, toilet, bathroom, fan, kitchen, water_supply, water_drink, parking_space, wifi, ellectricity_bill, discription, rules, roomId]

    const bookingValue = [room_no, price, roomId]
    try {
        const connection = await db.getConnection()
        try {
            await connection.beginTransaction();
            await connection.query(query, value)
            await connection.query(bookingQuery, bookingValue)
            await connection.commit();
            connection.release();
            // delete cached data-----------------------
            dataCache.del("search-rooms");
            dataCache.del("admin-rooms");
            res.status(200).json({
                success: true,
                message: "Room updated seccessfully"
            })
        } catch (error) {
            await connection.rollback();
            connection.release();
            return next(new ErrorHandler("Room updation failed", 500));
        }
    } catch (error) {
        return next(new ErrorHandler("database connection failed", 500));
    }

})


export const updatePhoto = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    const photoId = req.query.photoid as string
    if (!photoId) return next(new ErrorHandler("Please provide PhotoId", 400))

    const upload = upload_func(photoId)
    upload(req, res, (err) => {

        const files = req.files as Express.Multer.File[];
        if (err) {
            return next(new ErrorHandler("Photo not uploaded", 500));
        }
        if (!files || files.length === 0) {
            return next(new ErrorHandler("No files uploaded", 400));
        }
        const img = files.map((file) => {
            const encodedurl = encodeURIComponent(`${photoId}/${file.originalname}`)
            return `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${encodedurl}`
        })
        // delete cached data-----------------------
        dataCache.del("search-rooms");
        dataCache.del("admin-rooms");
        res.status(200).json({
            success: true,
            message: "Photo uploaded seccessfully",
            img: img
        })
    })
})
export const deleteRoom = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const roomId = req.query.roomId as string;
    const PhotoId = req.query.photoId as string;

    if (!roomId || !PhotoId) return next(new ErrorHandler("Please provide credentials", 404));

    const input = {
        Bucket: process.env.S3_BUCKET_NAME as string,
        Prefix: `rooms/${PhotoId}`,
    }

    try {
        const command1 = new ListObjectsV2Command(input);
        const data = await userS3.send(command1);


        // if (!data.Contents) {
        //     return next(new ErrorHandler("No photos found to delete", 404));
        // }
        const objects = data?.Contents?.map((item) => {
            return { Key: item.Key }
        })

        const params = {
            Bucket: process.env.S3_BUCKET_NAME as string,
            Delete: {
                Objects: objects
            },
            quite: false
        }
        const command2 = new DeleteObjectsCommand(params);

        const result = await userS3.send(command2);
        if (!result.Deleted || result.Deleted.length === 0) {
            return next(new ErrorHandler(`Room not deleted, try again: ${result}`, 500));//hii
        }
        // delete cached data-----------------------
        dataCache.del("search-rooms");
        const query = `DELETE FROM ROOMS WHERE ROOM_ID = ?`;

        const connection = await db.getConnection()
        try {

            const deleteRoom = await connection.query(query, roomId)
            connection.release();

            await Promise.all([result, deleteRoom])
            // delete cached data-----------------------
            dataCache.del("search-rooms");
            res.status(200).json({
                success: true,
                message: "Room deleted successfully"
            });

        } catch (error) {
            connection.release();
            next(new ErrorHandler(`Room not deleted, try again: ineer error:  ${error}`, 404));
        }

    } catch (error) {
        next(new ErrorHandler(`Room not deleted, try again: outer error: ${error}`, 404));
    }
});

export const searchingRooms = tryCatchFunction(
    async (req: Request<{}, {}, searchingRoomsTypes>, res: Response, next: NextFunction) => {
        const { location, price, room_type, gender, availability_date, latitude, longitude } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        if (!price || !location || !room_type || !gender || !availability_date) {
            return next(new ErrorHandler("Please Enter All Fields.", 400));
        }

        const connection = await db.getConnection();

        try {
            const cacheKey = `search-rooms-${location}-${price}-${room_type}-${gender}-${availability_date}-${page}-${limit}`;

            const query = `
        SELECT ROOMS.*, ADMINS.PHONE, ADMINS.HOSTEL_NAME 
        FROM ROOMS 
        JOIN ADMINS ON ROOMS.ADMIN_REF_ID = ADMINS.ADMIN_ID 
        WHERE ROOMS.PRICE <= ? 
          AND MATCH(ROOMS.LOCALITY, ROOMS.DISTRICT) AGAINST (? IN NATURAL LANGUAGE MODE)
          AND ROOMS.ROOM_TYPE = ? 
          AND ROOMS.GENDER = ? 
          AND ROOMS.AVAILABILITYDATE <= ?
        LIMIT ? OFFSET ?;
      `;

            const values = [price, location, room_type, gender, availability_date, limit, offset];

            const [rows] = await connection.query<RowDataPacket[]>(query, values);
            connection.release();

            const allRooms = await Promise.all(
                rows.map(async (room) => {
                    const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);
                    let distance = undefined;
                    if (latitude && longitude && room.LATITUDE && room.LONGITUDE) {
                        distance = getDistance(
                            { latitude, longitude },
                            { latitude: room.LATITUDE, longitude: room.LONGITUDE }
                        );

                    }
                    distance = distance ? (distance / 1000).toFixed(2) : "0.00";
                    if (distance === "0.00") {
                        distance = undefined;
                    }

                    return { room, photos, "distance": distance };
                })
            );

            if (allRooms.length === 0) return next(new ErrorHandler("No Room Found", 404))

            dataCache.set(cacheKey, JSON.stringify(allRooms), 60);

            res.status(200).json({
                success: true,
                rooms: allRooms,
                page,
                limit,
            });

        } catch (error) {
            connection.release();

            return next(new ErrorHandler("Failed to fetch Rooms", 400));
        }
    }
);

export const getRoomDetails = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const roomId = req.params.id;
    if (!roomId) return next(new ErrorHandler("Please provide Room Id", 404));

    const query = `SELECT rooms.*, admins.hostel_name, admins.phone
FROM rooms
JOIN admins ON rooms.admin_ref_id = admins.admin_id
WHERE rooms.room_id = ?;`
    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query<RowDataPacket[]>(query, roomId);
            connection.release();


            if (rows.length === 0) {
                return next(new ErrorHandler("Room not found", 404));
            }

            const room = rows[0];
            const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);

            res.status(200).json({
                success: true,
                room,
                photos
            });
        } catch (error) {
            connection.release();


            return next(new ErrorHandler("Failed to fetch room details", 500));
        }
    } catch (error) {
        return next(new ErrorHandler("Database connection failed", 500));
    }
})

export const getHomeDashData = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    if (dataCache.has("admin-home-dash")) {
        const cachedData = JSON.parse(dataCache.get("admin-home-dash") as string);
        return res.status(200).json({
            success: true,
            data: cachedData
        });
    }

    const adminId = getAdminId(req, res, next);
    if (!adminId) return next(new ErrorHandler("Please Login First !", 403));

    const connection = await db.getConnection();
    try {


        const query = `SELECT
  COUNT(DISTINCT ROOM_ID) AS total_rooms,
  COUNT(CASE WHEN BOOKING_STATUS = 'CONFIRMED' THEN 1 END) AS booked_rooms,
  COUNT(CASE WHEN BOOKING_STATUS != 'CONFIRMED' THEN 1 END) AS not_booked_rooms,
  COUNT(CASE WHEN PAYMENT_STATUS = 'PAID' THEN 1 END) AS paid_payments,
  COUNT(CASE WHEN PAYMENT_STATUS = 'UNPAID' THEN 1 END) AS unpaid_payments
FROM BOOKINGS
WHERE ADMIN_REF_ID =?;`

        const [adminHomeData] = await connection.query<RowDataPacket[]>(query, adminId);
        connection.release();

        if (adminHomeData.length === 0) return next(new ErrorHandler("No data found", 404));
        const data = adminHomeData[0];
        const responseData = {
            total_rooms: data.total_rooms || 0,
            booked_rooms: data.booked_rooms || 0,
            not_booked_rooms: data.not_booked_rooms || 0,
            paid_payments: data.paid_payments || 0,
            unpaid_payments: data.unpaid_payments || 0
        };

        dataCache.set("admin-home-dash", JSON.stringify(responseData), 60);

        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error) {
        return next(new ErrorHandler("Failed to fetch home dashboard data", 500));

    }

})

export const getAdminBookings = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const adminId = getAdminId(req, res, next);
    if (!adminId) return next(new ErrorHandler("Please Login First !", 403));
    if (dataCache.has(`admin-bookings`)) {
        const cachedBookings = JSON.parse(dataCache.get(`admin-bookings`) as string);
        return res.status(200).json({
            success: true,
            bookings: cachedBookings
        });
    }

    const query = `SELECT ROOM_NO, BOOKING_STATUS,PAYMENT_STATUS,PRICE,PAYMENT_DATE,AVAILABILITY_DATE FROM BOOKINGS WHERE ADMIN_REF_ID=?;`;
    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query<RowDataPacket[]>(query, adminId);
            connection.release();

            if (rows.length === 0) {
                return next(new ErrorHandler("No bookings found", 404));
            }
            dataCache.set(`admin-bookings`, JSON.stringify(rows), 60);

            res.status(200).json({
                success: true,
                bookings: rows
            });
        } catch (error) {
            connection.release();

            return next(new ErrorHandler("Failed to fetch bookings", 500));
        }
    } catch (error) {
        return next(new ErrorHandler("Database connection failed", 500));
    }
})


export const updatePayment = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    const { payment_status } = req.body;
    if (!payment_status || (payment_status !== 'PAID' && payment_status !== 'UNPAID')) return next(new ErrorHandler("Please provide valid payment status", 400));
    const adminId = getAdminId(req, res, next);
    const payment_date = new Date()

    if (payment_status === 'PAID') {
        const bookingQuery = 'UPDATE BOOKINGS SET PAYMENT_STATUS=?,PAYMENT_DATE=? WHERE ROOM_ID=?'
        const bookingValue = ['PAID', payment_date, adminId]

    } else if (payment_status === 'UNPAID') {
        const bookingQuery = 'UPDATE BOOKINGS SET PAYMENT_STATUS=?,PAYMENT_DATE=? WHERE ROOM_ID=?'
        const bookingValue = ['UNPAID', payment_date, adminId]
    }

})

export const roomAvailabilityChange = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

})
