import express from "express";
import sql from "mysql2";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { superErrorHandeler } from "./middleware/errorHandler.js";
import { userSchema } from "./schema/userSchema.js";
// import { userSchema } from "./schema/userSchema.js";
config({ path: "./.env" });
const app = express();
app.use(express.json());
app.use(cookieParser());
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
// adminSchema()
// roomSchema()
// roomPhotosSchema()
import users from "./routes/usersRoutes.js";
app.use("/api/version1", users);
app.use(superErrorHandeler);
app.listen(process.env.PORT, () => {
    console.log(`server is working on port ${process.env.PORT} `);
});
