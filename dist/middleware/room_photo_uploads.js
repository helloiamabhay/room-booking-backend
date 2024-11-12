import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from 'multer-s3';
// initialize s3 client
const userS3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});
// set up multer-s3
const uploads = multer({
    storage: multerS3({
        s3: userS3,
        bucket: process.env.S3_BUCKET_NAME,
        acl: 'public-read',
        key: (req, file, cb) => {
            cb(null, `rooms/to/${file.originalname}`);
        },
    }),
});
export const roomPhotoUploads = uploads.array('photos', 10);
