import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from 'multer-s3';
import { db } from "../app.js";
const userS3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    }
});
// upload images on s3 bucket ======================================
export const upload_func = (photo_url_id) => {
    console.log("region : " + process.env.AWS_REGION + ", accessKeyId : " + process.env.ACCESS_KEY + ", secret key : " + process.env.SECRET_ACCESS_KEY);
    return multer({
        storage: multerS3({
            s3: userS3,
            bucket: "room-booking-app",
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: function (req, file, cb) {
                cb(null, `rooms/${photo_url_id}/${file.originalname}`);
            }
        })
    }).array('photos', 10);
};
// search images from s3 bucket ===============================
export const allPhotoByAdminId = async (photoId) => {
    const input = {
        Bucket: 'room-booking-app',
        Prefix: `rooms/${photoId}`,
    };
    try {
        const command = new ListObjectsV2Command(input);
        const data = await userS3.send(command);
        if (!data.Contents) {
            return [];
        }
        const photoUrls = data.Contents.map((item) => {
            const urls = `https://${input.Bucket}.s3.ap-south-1.amazonaws.com/${item.Key}`;
            return urls;
        });
        return photoUrls;
    }
    catch {
        console.warn("Internet is not working");
    }
};
export const getPhotoUrlId = async (admin_ref_id) => {
    const query = 'SELECT PHOTO_URL_ID FROM ROOMS WHERE ADMIN_REF_ID = ?';
    return new Promise((resolve, reject) => {
        db.query(query, admin_ref_id, (err, result) => {
            if (err) {
                return reject(`Error:`);
            }
            resolve(result);
        });
    });
};
