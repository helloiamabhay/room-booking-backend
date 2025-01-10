import { NextFunction, Request, Response } from "express";
import { db } from "../app.js";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { createAdminDataType, loginDataType } from "../types/types.js";
import validator from "validator";
import ErrorHandler from "../middleware/customError.js";
import { RowDataPacket } from "mysql2";
import jwt, { JwtPayload } from "jsonwebtoken";


export const createAdmin = tryCatchFunction(async (req: Request<{}, {}, createAdminDataType>, res: Response, next: NextFunction) => {
    const { first_name, last_name, phone, email, password, hostel_name, state, district, town_name, pinCode, gender } = req.body;

    // validate inputs
    if (!first_name || !phone || !email || !password || !hostel_name || !state || !district || !town_name || !pinCode || !gender) return next(new ErrorHandler("Please enter All fields!", 400));

    // validate phone and email
    if (!validator.isMobilePhone(String(phone), 'en-IN')) return next(new ErrorHandler("Please enter valid phone number.", 400));
    if (!validator.isEmail(email)) return next(new ErrorHandler("Please enter valid email Id.", 400));

    const existAdminPromise = new Promise<boolean>((resolve, reject) => {
        db.query<RowDataPacket[]>(`SELECT * FROM ADMINS WHERE PHONE=? OR EMAIL=?`, [phone, email], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0);
            }
        })
    })

    //  check user exists
    const existAdmin = await existAdminPromise;


    if (existAdmin) {
        return next(new ErrorHandler("User already exists!", 400));
    }

    // hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    // query 
    const query = `INSERT INTO ADMINS(ADMIN_ID,FIRST_NAME,LAST_NAME,PHONE,EMAIL,PASSWORD,HOSTEL_NAME,STATE,DISTRICT,PINCODE,TOWN_NAME,GENDER) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) `

    const admin_id = uuidv4();


    const values = [admin_id, first_name, last_name, phone, email, hashedPassword, hostel_name, state, district, pinCode, town_name, gender]

    // run query
    db.query(query, values, (err, result) => {
        if (err) return next(new ErrorHandler(`Error is : ${err.message}`, 400));
        else {

            // generate jwt token
            const token = jwt.sign({ admin_id }, process.env.JWT_SECRET as string, { expiresIn: '10d' });

            // set cookie with jwt token
            res.cookie('adminAuthToken', token, {
                maxAge: 10 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            })

            res.status(201).json({
                success: true,
                message: `Dear ${first_name},Account created!`
            })
        }
    })
})

// login admin
export const loginAdmin = tryCatchFunction(async (req: Request<{}, {}, loginDataType>, res: Response, next: NextFunction) => {

    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) return next(new ErrorHandler("Please enter all fields", 400));

    const existUserPromise = new Promise<RowDataPacket[]>((resolve, reject) => {

        db.query<RowDataPacket[]>(`SELECT * FROM ADMINS WHERE PHONE=? OR EMAIL=?`, [phoneOrEmail, phoneOrEmail], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result)
            }
        })
    })

    const adminExist = await existUserPromise;


    if (adminExist.length < 1) return next(new ErrorHandler("Wrong Password.", 401));

    // password verification
    const admin = adminExist[0];


    const isValidPassword = await bcrypt.compare(password, admin.PASSWORD);


    if (!isValidPassword) return next(new ErrorHandler("Wrong Password.", 401));


    const token = jwt.sign({ admin_id: admin.ADMIN_ID }, process.env.JWT_SECRET as string, { expiresIn: '10d' });

    res.cookie('adminAuthToken', token, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict"
    })

    res.status(201).json({
        success: true,
        message: `Welcome Back ${admin.FIRST_NAME}! `
    })
})


export const adminLogout = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('adminAuthToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    })

    res.status(200).json({
        success: true,
        message: "Logged Out Seccessfully!"
    })

})


