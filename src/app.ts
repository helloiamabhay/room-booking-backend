import express from "express";
import sql from "mysql2/promise";
import { config } from "dotenv";
import cors from "cors";
import { DBConfig } from "./types/types.js";
import cookieParser from "cookie-parser"
import { superErrorHandeler } from "./middleware/errorHandler.js";
import users from "./routes/usersRoutes.js";
import roomAdmins from "./routes/adminRoutes.js";
import payment from "./routes/paymentRoutes.js";
import { S3Client } from "@aws-sdk/client-s3";
import { adminSchema } from "./schema/adminSchema.js";
import { roomSchema } from "./schema/roomSchema.js";
import NodeCache from "node-cache";
import { getDistance } from "geolib";
import { bookingSchema } from "./schema/bookingSchema.js";
import { paymentSchema } from "./schema/paymentSchema.js";

const app = express();
config({ path: "./.env" })
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

export const dataCache = new NodeCache();


export const userS3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY as string,
        secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
    }
});

// database connection 
export const db = sql.createPool({
    host: process.env.HOST as string,
    user: process.env.USER as string,
    password: process.env.PASSWORD as string,
    database: process.env.DATABASE as string,
    connectionLimit: 10,
    idleTimeout: 30000
});

db.getConnection()
    .then((connection: sql.PoolConnection) => {

        console.log('Database connected successfully');
        // console.log(distance);

        connection.release();
    })
    .catch((err: sql.QueryError) => {
        console.error('Error connecting to the database:', err);
    });
// adminSchema()
// roomSchema()
// bookingSchema()
// deletePhotofunction()
paymentSchema()
// import users from "./routes/usersRoutes.js";
// import roomAdmins from "./routes/adminRoutes.js";
app.use("/api/v1/users", users)
app.use("/api/v1/admins", roomAdmins)
app.use("/api/v1/transaction", payment)
app.use(superErrorHandeler)

app.listen(process.env.PORT, () => {
    console.log(`server is working on port ${process.env.PORT}`);
})



