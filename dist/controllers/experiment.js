export {};
// export const deletePhotofunction = async (req: Request, res: Response, next: NextFunction) => {
//     const key = req.query.key;
//     if (!key) return next(new ErrorHandler("Please provide key ", 404))
//     // console.log("key is : " + key);
//     const params = {
//         Bucket: 'room-booking-app',
//         Key: `rooms/${key}`
//     }
//     try {
//         await userS3.send(new DeleteObjectCommand(params))
//         // console.log("photo deleted");
//         res.status(200).json({
//             success: true,
//             message: `this photo deleted seccessfully : https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${key}`
//         })
//     } catch (error) {
//         // console.log("photo not deleted: ");
//         next(new ErrorHandler("Photo not deleted try again", 404));
//     }
// }
