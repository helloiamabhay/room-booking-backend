import express from "express";
import sql from "mysql2";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { superErrorHandeler } from "./middleware/errorHandler.js";
import users from "./routes/usersRoutes.js";
import roomAdmins from "./routes/adminRoutes.js";
import { S3Client } from "@aws-sdk/client-s3";
const app = express();
config({ path: "./.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// set auth of database
const dbConfig = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
};
export const userS3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    }
});
// database connection 
export const db = sql.createConnection(dbConfig);
db.connect(function (err) {
    if (err) {
        console.error("DB not connected");
    }
    else {
        console.log("db connected");
    }
});
// adminSchema()
// roomSchema()
// deletePhotofunction()
// import users from "./routes/usersRoutes.js";
// import roomAdmins from "./routes/adminRoutes.js";
app.use("/api/v1/users", users);
app.use("/api/v1/admins", roomAdmins);
app.use(superErrorHandeler);
app.listen(process.env.PORT, () => {
    console.log(`server is working on port ${process.env.PORT} `);
});
