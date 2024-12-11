import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from 'multer-s3';


const userS3 = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIA2RVCYWOV6F42DZNL",
        secretAccessKey: "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",
    },
});

export const upload_func = (photo_url_id: string) => {
    return multer({
        storage: multerS3({
            s3: userS3,
            bucket: "room-booking-app",
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: function (req, file, cb) {
                cb(null, `rooms/${photo_url_id}/${file.originalname}`)
            }
        })
    }).array('photos', 10)
}
