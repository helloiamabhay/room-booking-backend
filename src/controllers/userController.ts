import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import { createUserBodyData } from "../types/types.js";
import { stat } from "fs";
import { db } from "../app.js";
import ErrorHandler from "../middleware/customError.js";


export const createUser = tryCatchFunction(async (req: Request<{}, {}, createUserBodyData>, res: Response, next: NextFunction) => {
    // take data from user
    const { first_name, last_name, password, email, phone, altPhone, state, district, town, pinCode, gender } = req.body;
    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log(hashedPassword);

    // query
    const query = `INSERT INTO USERS (first_name,last_name,password,email,phone,altPhone,state,district,town,pinCode,gender) VALUES (?,?,?,?,?,?,?,?,?,?,?)`

    // values for query
    const values = [first_name, last_name, hashedPassword, email, phone, altPhone, state, district, town, pinCode, gender]

    // run query 
    db.query(query, values, (err, result) => {

        if (err) next(new ErrorHandler("Error in run query", 404));




    })




})