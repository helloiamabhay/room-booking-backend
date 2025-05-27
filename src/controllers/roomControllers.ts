import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import ErrorHandler from "../middleware/customError.js";
import { v4 as uuidv4 } from "uuid";
import { dataCache, db, userS3 } from "../app.js";
import { createRoomTypes, searchingRoomsTypes } from "../types/types.js";
import { allPhotoByAdminId, upload_func } from "../middleware/room_photo_uploads.js";
import { RowDataPacket } from "mysql2";
import { getAdminId } from "../middleware/userAuthentication.js";
import { MulterError } from "multer";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getDistance } from "geolib";


// create room ======================================================================
export const roomController = tryCatchFunction(async (req: Request<{}, {}, createRoomTypes>, res: Response, next: NextFunction) => {

    const room_id = uuidv4();
    const photo_url_id = uuidv4();
    // fix bug in future to dont upload photo without require info
    const upload = upload_func(String(photo_url_id));
    upload(req, res, async (err) => {

        const admin_ref_id = getAdminId(req, res, next)

        const { price, locality, district, latitude, longitude, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body

        // take cordinates from frontend
        if (!price || !locality || !district || !room_status || !bed || !bed_sit || !toilet || !bathroom || !fan || !kitchen || !table_chair || !almira || !water_supply || !water_drink || !parking_space || !wifi || !ellectricity_bill || !rules) return next(new ErrorHandler("please enter all fields", 400));


        const values = [room_id, admin_ref_id, price, locality, district, latitude, longitude, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, photo_url_id]

        try {
            const connection = await db.getConnection();
            try {
                const query = `INSERT INTO ROOMS(ROOM_ID,ADMIN_REF_ID,PRICE,LOCALITY,DISTRICT,LATITUDE,LONGITUDE,ROOM_STATUS,BED,BED_SIT,TOILET,BATHROOM,FAN,KITCHEN,TABLE_CHAIR,ALMIRA,WATER_SUPPLY,WATER_DRINK,PARKING_SPACE,WIFI,ELLECTRICITY_BILL,RULES,PHOTO_URL_ID) VALUES 
    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`

                connection.query(query, values)
                connection.release()
                // delete cached data-----------------------
                dataCache.del("search-rooms")
            } catch (error) {
                connection.release()
                return next(new ErrorHandler("Room not created Try again", 404))
            }
        } catch (error) {
            return next(new ErrorHandler("DB connection failed try again ", 404))

        }

        const files = req.files as Express.Multer.File[];
        if (err == 'MulterError: Unexpected field' || err == MulterError) return next(new ErrorHandler("One time you can uploads 10 photos", 404));
        if (err) return next(new ErrorHandler(`Could't upload, Please Try again`, 400));
        if (!files || files.length === 0) return next(new ErrorHandler("Please select at-least one photo", 404));

        const imgs = files.map(file => `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`)
        // delete cached data-----------------------
        dataCache.del("search-rooms")
        res.status(201).json({
            room: values,
            imgs: imgs

        })
    })

})



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
                    return [room, photos]

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

    const { price, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules } = req.body

    const query = ` UPDATE rooms SET PRICE = ?,ROOM_STATUS = ?, BED = ?, BED_SIT = ?, TOILET = ?, BATHROOM = ?, FAN = ?, KITCHEN = ?, TABLE_CHAIR = ?, ALMIRA = ?, WATER_SUPPLY = ?, WATER_DRINK = ?, PARKING_SPACE = ?, WIFI = ?, ELLECTRICITY_BILL = ?, RULES = ? WHERE ROOM_ID = ? `;

    const value = [price, room_status, bed, bed_sit, toilet, bathroom, fan, kitchen, table_chair, almira, water_supply, water_drink, parking_space, wifi, ellectricity_bill, rules, roomId]

    try {
        const connection = await db.getConnection()
        try {
            connection.query(query, value)
            connection.release();
            // delete cached data-----------------------
            dataCache.del("search-rooms");
            res.status(200).json({
                success: true,
                message: "Room updated seccessfully"
            })
        } catch (error) {
            connection.release();
            return next(new ErrorHandler("Room updation failed", 500));
        }
    } catch (error) {
        return next(new ErrorHandler("database connection failed", 500));
    }

})


export const updatePhoto = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    const photoId = req.params.id
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
            return `https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${photoId}/${encodeURIComponent(file.originalname)}`
        })
        // delete cached data-----------------------
        dataCache.del("search-rooms");
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
        if (!data.Contents) {
            return next(new ErrorHandler("No photos found to delete", 404));
        }
        const objects = data.Contents.map((item) => {
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
            return next(new ErrorHandler("Room not deleted, try again", 500));//hii
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
            next(new ErrorHandler("Room not deleted, try again", 404));
        }

    } catch (error) {
        next(new ErrorHandler("Room not deleted, try again", 404));
    }
});

export const searchingRooms = tryCatchFunction(async (req: Request<{}, {}, searchingRoomsTypes>, res: Response, next: NextFunction) => {

    const { locality, district, price } = req.body

    if (!price) return next(new ErrorHandler("Please Enter Price", 404));
    if (!locality && !district) return next(new ErrorHandler("Please Enter Lcality or Aria Name or District", 404));

    let latitude;
    let longitude;
    // if cordinates then execute this code ==========================================================================
    if (latitude && longitude) {
        // check data is cached or not--------------
        // if (dataCache.has("search-rooms")) {
        //     const rooms = JSON.parse(dataCache.get("search-rooms") as string);
        //     res.status(200).json({
        //         success: true,
        //         rooms: rooms
        //     })
        // } else {

        const query = `SELECT ROOMS.*, ADMINS.PHONE, ADMINS.HOSTEL_NAME FROM ROOMS JOIN 
    ADMINS ON ROOMS.ADMIN_REF_ID = ADMINS.ADMIN_ID WHERE  PRICE <= ? AND (LOCALITY = ? OR ROOMS.DISTRICT = ?) AND ROOM_STATUS = 'false';`

        const connection = await db.getConnection();
        try {
            const value = [price, locality, district]
            const [rows] = await connection.query<RowDataPacket[]>(query, value)
            connection.release()

            const allRooms = await Promise.all(rows.map(async (room) => {
                let distance;
                if (room.LATITUDE && room.LONGITUDE) {
                    distance = getDistance({ latitude: latitude, longitude: longitude }, { latitude: room.LATITUDE, longitude: room.LONGITUDE });
                }
                const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);
                return { room, photos, distance };
            }))
            // set data in cache for 60 sec ========================
            dataCache.set("search-rooms", JSON.stringify(allRooms), 60)
            res.status(200).json({
                success: true,
                rooms: allRooms
            })

        } catch (error) {
            connection.release()
            return next(new ErrorHandler("Failed to fetch Rooms", 400));
        }
        // }
        // if not cordinates then execute this code ==========================================================================
    } else {
        // chech data cache-----------
        // if (dataCache.has("search-rooms")) {
        //     const rooms = JSON.parse(dataCache.get("search-rooms") as string);
        //     res.status(200).json({
        //         success: true,
        //         rooms: rooms
        //     })
        // } else {
        const connection = await db.getConnection()
        try {
            const query = `SELECT ROOMS.*, ADMINS.PHONE, ADMINS.HOSTEL_NAME FROM ROOMS JOIN 
    ADMINS ON ROOMS.ADMIN_REF_ID = ADMINS.ADMIN_ID WHERE  PRICE <= ? AND (LOCALITY = ? OR ROOMS.DISTRICT = ?) AND ROOM_STATUS = 'false';`
            const value = [price, locality, district]

            console.log("working searching");

            const [rows] = await connection.query<RowDataPacket[]>(query, value);
            connection.release()

            const allRooms = await Promise.all(rows.map(async (room) => {
                const photos = await allPhotoByAdminId(room.PHOTO_URL_ID);
                return [room, photos]

            }))
            // set data in cache for 60 sec ========================
            dataCache.set("search-rooms", JSON.stringify(allRooms), 60)

            // if (allRooms.length === 0) return next(new ErrorHandler("No Room Found!", 404));
            res.status(200).json({
                success: true,
                rooms: allRooms
            })
        } catch (error) {
            connection.release()
            return next(new ErrorHandler("Failed to fetch Rooms", 400));
        }
        // }
    }
})