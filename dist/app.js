import express from "express";
import sql from "mysql2";
import { config } from "dotenv";
import { superErrorHandeler } from "./middleware/errorHandler.js";
import { userSchema } from "./schema/userSchema.js";
import { adminSchema } from "./schema/adminSchema.js";
import { roomSchema } from "./schema/roomSchema.js";
import { roomPhotosSchema } from "./schema/roomPhotos.js";
// import { userSchema } from "./schema/userSchema.js";
config({ path: "./.env" });
const app = express();
// set auth of database
const dbConfig = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
};
// database connection
export const db = sql.createConnection(dbConfig);
db.connect(function (err) {
    if (err)
        throw err;
    console.log("db connected");
});
userSchema();
adminSchema();
roomSchema();
roomPhotosSchema();
app.use(superErrorHandeler);
app.listen(2000, () => {
    console.log("server is working on port 2000");
});
