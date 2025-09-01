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
import { log } from "console";



export const createUser = tryCatchFunction(async (req: Request<{}, {}, createUserBodyData>, res: Response, next: NextFunction) => {
    // take data from user
    const { first_name, last_name, email, password, phone, altPhone, state, district, town, pinCode, gender } = req.body;

    if (!first_name || !email || !password || !gender || !phone) return next(new ErrorHandler("Please enter all fields!", 400));

    if (phone) {
        if (!validator.isMobilePhone(String(phone), 'en-IN')) {
            return next(new ErrorHandler("Invalid phone number", 400));
        }
    }

    if (!validator.isEmail(email)) return next(new ErrorHandler("Please enter valid email.", 400));

    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM USERS WHERE phone=? OR email=?`, [phone, email]);
            connection.release();
            if (rows.length > 0) {
                return next(new ErrorHandler("User already exists", 400));
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            // query
            const query = `INSERT INTO USERS (userId,first_name,last_name,password,email,phone,altPhone,state,district,town,pinCode,gender) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
            const userId = uuidv4();

            const values = [userId, first_name, last_name, hashedPassword, email, phone, altPhone, state, district, town, pinCode, gender]

            await connection.query(query, values);
            connection.release();

            const token = jwt.sign({ userId, first_name, email, phone }, process.env.JWT_SECRET as string, { expiresIn: '15d' });

            res.cookie('userAuthToken', token, {
                maxAge: 15 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'strict'

            })
            res.status(201).json({
                success: true,
                message: `Dear ${first_name},Account created!`
            })
        } catch (error) {
            connection.release();
            return next(new ErrorHandler("DB request failed Try again: " + error, 500))

        }

    } catch (error) {
        return next(new ErrorHandler("Failed to get database connection.", 500));
    }


})

export const loginUser = tryCatchFunction(async (req: Request<{}, {}, loginDataType>, res: Response, next: NextFunction) => {

    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) return next(new ErrorHandler("Please enter all fields !", 400))


    try {
        const connection = await db.getConnection();
        try {
            const value = [phoneOrEmail, phoneOrEmail]
            const [rows] = await connection.query<RowDataPacket[]>(`SELECT userId,first_name,email,password,phone FROM USERS WHERE phone=? OR email=?`, value);

            connection.release();
            if (rows.length === 0) {
                return next(new ErrorHandler("Incorrect Password or User!", 401));
            }
            const user = rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!isPasswordValid) {
                return next(new ErrorHandler("Incorrect Password or User!", 401));
            }


            const token = jwt.sign({ userId: user.userId, first_name: user.first_name, email: user.email, phone: user.phone }, process.env.JWT_SECRET as string, { expiresIn: '15d' });

            res.cookie('userAuthToken', token, {
                maxAge: 15 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,// in future true in prod
                sameSite: 'strict'// in future 'strict' in prod
            })

            res.status(200).json({
                success: true,
                message: `Welcome Back ${user.first_name}! `
            })

        } catch (error) {
            connection.release();
            return next(new ErrorHandler("DB request failed Try again: ", 500))

        }
    } catch (error) {
        return next(new ErrorHandler("Failed to get database connection.", 500));

    }

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


// // user data
// export const getUserData = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.cookies.userAuthToken ? jwt.verify(req.cookies.userAuthToken, process.env.JWT_SECRET as string)?.userId : null;
//     if (!userId) return next(new ErrorHandler("Unauthorized access", 401));
//     try {
//         const connection = await db.getConnection();
//         try {
//             const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM USERS WHERE userId=?`, [userId]);
//             connection.release();
//             if (rows.length === 0) return next(new ErrorHandler("User does not exists", 404));


//             res.status(200).json({
//                 success: true,
//                 data: rows[0]
//             })
//         } catch (error) {
//             connection.release();
//             return next(new ErrorHandler("DB request failed Try again: ", 500))

//         }
//     } catch (error) {
//         return next(new ErrorHandler("Failed to get database connection.", 500));

//     }
// })