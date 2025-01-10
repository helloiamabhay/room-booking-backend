// import { tryCatchFunction } from '../middleware/errorHandler.js';
// import { db, userS3 } from '../app.js';
// import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
// import ErrorHandler from '../middleware/customError.js';
// import { NextFunction, Request, Response } from 'express';
export {};
// export const deleteRoom = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
//     const roomId = req.query.roomId as string;
//     const PhotoId = req.query.photoId as string;
//     if (!roomId || !PhotoId) return next(new ErrorHandler("Please provide credentials", 404));
//     const input = {
//         Bucket: process.env.S3_BUCKET_NAME as string,
//         Prefix: `rooms/${PhotoId}`,
//     }
//     try {
//         const command1 = new ListObjectsV2Command(input);
//         const data = await userS3.send(command1);
//         if (!data.Contents) {
//             return next(new ErrorHandler("No photos found to delete", 404));
//         }
//         const objects = data.Contents.map((item) => {
//             return { Key: item.Key }
//         })
//         const params = {
//             Bucket: process.env.S3_BUCKET_NAME as string,
//             Delete: {
//                 Objects: objects
//             },
//             quite: false
//         }
//         const command2 = new DeleteObjectsCommand(params);
//         const result = await userS3.send(command2);
//         if (!result.Deleted || result.Deleted.length === 0) {
//             return next(new ErrorHandler("Room not deleted, try again", 500));//hii
//         }
//         const query = `DELETE FROM ROOMS WHERE ROOM_ID = ?`;
//         const deleteRoomPromise = new Promise((resolve, reject) => {
//             db.query(query, roomId, (err, result) => {
//                 if (err) {
//                     return reject(new ErrorHandler("Room not deleted, try again", 404));
//                 }
//                 resolve(result);
//             });
//         });
//         await Promise.all([result, deleteRoomPromise]);
//         res.status(200).json({
//             success: true,
//             message: "Room deleted successfully"
//         });
//     } catch (error) {
//         next(new ErrorHandler("Room not deleted, try again", 404));
//     }
// });
// export const deletePhoto = async (req: Request, res: Response, next: NextFunction) => {
//     const photoId = req.query.photoId as string;
//     const input = {
//         Bucket: process.env.S3_BUCKET_NAME as string,
//         Prefix: `rooms/${photoId}`,
//     }
//     try {
//         const command1 = new ListObjectsV2Command(input);
//         const data = await userS3.send(command1);
//         if (!data.Contents) {
//             return [];
//         }
//         const objects = data.Contents.map((item) => {
//             return { Key: item.Key }
//         })
//         const params = {
//             Bucket: process.env.S3_BUCKET_NAME as string,
//             Delete: {
//                 Objects: objects
//             },
//             quite: false
//         }
//         const command2 = new DeleteObjectsCommand(params);
//         const result = await userS3.send(command2);
//         console.log("Photos deleted seccessfully", result.Deleted);
//         res.status(200).json({
//             success: true,
//             message: "Photos deleted seccessfully",
//             keys: result
//         })
//     } catch (error) {
//         console.warn("Internet is not working" + error)
//     }
// }
