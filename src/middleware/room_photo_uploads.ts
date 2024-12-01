import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from "./customError.js";

const userS3 = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIA2RVCYWOV6F42DZNL",
        secretAccessKey: "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",
    },
});

export const upload = multer({
    storage: multerS3({
        s3: userS3,
        bucket: "room-booking-app",
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, `roomPhoto/12345/${file.originalname}`)
        }
    })
}).array('photos', 10)




//==============================================================================
// import { S3Client } from "@aws-sdk/client-s3";
// import multer from "multer";
// import multerS3 from 'multer-s3';
// import { v4 as uuidv4 } from "uuid";

// export async function uploadPhotos(photoUrlId, config) {
//     const { bucketName, fileKeyPrefix, allowedFileTypes } = config;

//     // Initialize S3 client with error handling
//     const s3Client = new S3Client({
//         region: process.env.AWS_REGION,
//         credentials: {
//             accessKeyId: process.env.ACCESS_KEY,
//             secretAccessKey: process.env.SECRET_ACCESS_KEY,
//         },
//     });

//     // Set up multer-s3 with error handling and file validation
//     const upload = multer({
//         storage: multerS3({
//             s3: s3Client,
//             bucket: bucketName,
//             acl: 'public-read',
//             key: (req, file, cb) => {
//                 const fileKey = `${fileKeyPrefix}/${photoUrlId}/${file.originalname}`;
//                 cb(null, fileKey);
//             },
//         }),
//         fileFilter: (req, file, cb) => {
//             if (allowedFileTypes.includes(file.mimetype)) {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Invalid file type'));
//             }
//         },
//     }).array('photos', 10);

//     return new Promise((resolve, reject) => {
//         upload(req, res, async (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 const fileUrls = req.files.map((file) => file.location);
//                 resolve(fileUrls);
//             }
//         });
//     });
// }

//=================================================================
// const photoUrlId = 'your-photo-url-id';
// const config = {
//     bucketName: process.env.S3_BUCKET_NAME,
//     fileKeyPrefix: 'rooms',
//     allowedFileTypes: ['image/jpeg', 'image/png'],
// };

// try {
//     const fileUrls = await uploadPhotos(photoUrlId, config);
//     // Use the uploaded file URLs
// } catch (err) {
//     console.error('Error uploading photos:', err);
// }
