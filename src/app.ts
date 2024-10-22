
import express from "express";
import sql, { createConnection } from "mysql2";
import { config } from "dotenv";
import { DBConfig } from "./types/types.js";
import cookieParser from "cookie-parser"
import { superErrorHandeler } from "./middleware/errorHandler.js";
import { userSchema } from "./schema/userSchema.js";
import { adminSchema } from "./schema/adminSchema.js";
import { roomSchema } from "./schema/roomSchema.js";
import { roomPhotosSchema } from "./schema/roomPhotos.js";
// import { userSchema } from "./schema/userSchema.js";


config({ path: "./.env" })
const app = express();
app.use(express.json());
app.use(cookieParser());

// set auth of database
const dbConfig: DBConfig = {
    host: process.env.HOST as string,
    user: process.env.USER as string,
    password: process.env.PASSWORD as string,
    database: process.env.DATABASE as string,
};

// database connection
export const db = sql.createConnection(dbConfig);
db.connect(function (err) {
    if (err) throw err;
    console.log("db connected");
})

userSchema()
adminSchema()
roomSchema()
roomPhotosSchema()


import users from "./routes/usersRoutes.js";
import roomAdmins from "./routes/adminRoutes.js";

app.use("/api/v1/users", users)
app.use("/api/v1/admins", roomAdmins)


app.use(superErrorHandeler)

app.listen(process.env.PORT, () => {
    console.log(`server is working on port ${process.env.PORT} `);
})
