import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import { db } from "../app.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken"
import { createUserBodyData, loginDataType } from "../types/types.js";
import ErrorHandler from "../middleware/customError.js";
import { RowDataPacket } from "mysql2";



export const createUser = tryCatchFunction(async (req: Request<{}, {}, createUserBodyData>, res: Response, next: NextFunction) => {
    // take data from user
    const { first_name, last_name, email, password, phone, altPhone, state, district, town, pinCode, gender } = req.body;

    if (!first_name || !email || !password) return next(new ErrorHandler("Please enter all fields!", 400));

    if (phone) {
        if (!validator.isMobilePhone(String(phone), 'en-IN')) {
            return next(new ErrorHandler("Invalid phone number", 400));
        }
    }

    if (!validator.isEmail(email)) return next(new ErrorHandler("Please enter valid email.", 400));

    // check user exist or not 
    const existUserPromise = new Promise<boolean>((resolve, reject) => {
        db.query<RowDataPacket[]>(`SELECT * FROM USERS WHERE phone=? OR email=?`, [phone, email], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0);
            }
        })
    })

    const userExists = await existUserPromise;
    if (userExists) {
        return next(new ErrorHandler("User already exists", 400));
    }

    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10)

    // query
    const query = `INSERT INTO USERS (userId,first_name,last_name,password,email,phone,altPhone,state,district,town,pinCode,gender) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    const userId = uuidv4();
    // values for query
    const values = [userId, first_name, last_name, hashedPassword, email, phone, altPhone, state, district, town, pinCode, gender]
    // run query 
    db.query(query, values, (err, result) => {
        if (err) return next(new ErrorHandler(`err is : ${err.message}`, 404));
        else {
            // generate jwt token 
            const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '15d' });
            // set cookie with jwt token 
            res.cookie('userAuthToken', token, {
                maxAge: 15 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });

            res.status(201).json({
                success: true,
                message: "user created seccessfuly"
            })
        }
    })
})

export const loginUser = tryCatchFunction(async (req: Request<{}, {}, loginDataType>, res: Response, next: NextFunction) => {

    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) return next(new ErrorHandler("Please enter all fields !", 400))

    // check user exist or not 
    const existUserPromise = new Promise<RowDataPacket[]>((resolve, reject) => {
        db.query<RowDataPacket[]>(`SELECT * FROM USERS WHERE phone=? OR email=?`, [phoneOrEmail, phoneOrEmail], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })
    })

    const userExists = await existUserPromise;

    if (userExists.length < 1) return next(new ErrorHandler("Incorrect Password or User!", 401));

    const user = userExists[0];
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) return next(new ErrorHandler("Incorrect Password or Id!", 401));


    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET as string, { expiresIn: '15d' });

    res.cookie('userAuthToken', token, {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    })

    res.status(200).json({
        success: true,
        message: `Welcome Back ${user.first_name}! `
    })

})

export const logoutUser = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    res.clearCookie("userAuthToken", {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    });

    res.status(200).json({
        success: true,
        message: "Logged Out Seccessfully!"
    })

})