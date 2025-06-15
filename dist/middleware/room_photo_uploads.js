import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from 'multer-s3';
import { userS3 } from "../app.js";
import ErrorHandler from "./customError.js";
// upload images on s3 bucket ======================================
export const upload_func = (photo_url_id) => {
    return multer({
        storage: multerS3({
            s3: userS3,
            bucket: process.env.S3_BUCKET_NAME,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: function (req, file, cb) {
                cb(null, `rooms/${photo_url_id}/${encodeURIComponent(file.originalname)}`);
            }
        })
    }).array('photos', 10);
};
// search images from s3 bucket ===============================
export const allPhotoByAdminId = async (photoId) => {
    const input = {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: `rooms/${photoId}`,
    };
    // console.log(input);
    try {
        const command = new ListObjectsV2Command(input);
        const data = await userS3.send(command);
        if (!data.Contents) {
            return [];
        }
        const photoUrls = data.Contents.map((item) => {
            const key = item.Key ?? "";
            const urls = `https://${input.Bucket}.s3.ap-south-1.amazonaws.com/${encodeURIComponent(key)}`;
            return urls;
        });
        return photoUrls;
    }
    catch (error) {
        console.warn("Internet is not working" + error);
    }
};
export const deletePhotofunction = async (req, res, next) => {
    const key = req.query.key;
    if (!key)
        return next(new ErrorHandler("Please provide key ", 404));
    // console.log("key is : " + key);
    const params = {
        Bucket: 'room-booking-app',
        Key: `rooms/${key}`
    };
    try {
        await userS3.send(new DeleteObjectCommand(params));
        // console.log("photo deleted");
        res.status(200).json({
            success: true,
            message: `this photo deleted seccessfully : https://room-booking-app.s3.ap-south-1.amazonaws.com/rooms/${key}`
        });
    }
    catch (error) {
        // console.log("photo not deleted: ");
        next(new ErrorHandler("Photo not deleted try again", 404));
    }
};
