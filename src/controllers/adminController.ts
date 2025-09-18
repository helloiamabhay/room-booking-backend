import { NextFunction, Request, Response } from "express";
import { db } from "../app.js";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { createAdminDataType, loginDataType } from "../types/types.js";
import validator from "validator";
import ErrorHandler from "../middleware/customError.js";
import { RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";
import { connect } from "http2";
import { getAdminId } from "../middleware/authentication.js";
import { log } from "console";

// create admin *********************************************************************************************
export const createAdmin = tryCatchFunction(async (req: Request<{}, {}, createAdminDataType>, res: Response, next: NextFunction) => {
    const { first_name, last_name, phone, email, password, hostel_name, state, district, town_name, pinCode, gender } = req.body;

    // validate inputs
    if (!first_name || !phone || !email || !password || !hostel_name || !state || !district || !town_name || !pinCode || !gender) return next(new ErrorHandler("Please enter All fields!", 400));

    // validate phone and email
    if (!validator.isMobilePhone(String(phone), 'en-IN')) return next(new ErrorHandler("Please enter valid phone number.", 400));
    if (!validator.isEmail(email)) return next(new ErrorHandler("Please enter valid email Id.", 400));


    try {

        const connection = await db.getConnection()
        try {
            const [rows] = await connection.query<RowDataPacket[]>(`SELECT PHONE,EMAIL FROM ADMINS WHERE PHONE=? OR EMAIL=?`, [phone, email])
            connection.release();
            if (rows.length > 0) {
                return next(new ErrorHandler("User already exists!", 400));
            }

            // Hashing password
            const hashedPassword = await bcrypt.hash(password, 10);

            const admin_id = uuidv4();

            // Insert new admin
            const query = `INSERT INTO ADMINS (ADMIN_ID, FIRST_NAME, LAST_NAME, PHONE, EMAIL, PASSWORD, HOSTEL_NAME,STATE, DISTRICT,PINCODE ,TOWN_NAME, GENDER) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;
            const values = [admin_id, first_name, last_name, phone, email, hashedPassword, hostel_name, state, district, pinCode, town_name, gender]

            await connection.query(query, values);
            connection.release();

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

        } catch (error) {
            connection.release();
            return next(new ErrorHandler("DB request failed Try again: " + error, 500))

        }


    } catch (error) {
        return next(new ErrorHandler("Failed to get database connection.", 500));
    }

})

// login admin  *********************************************************************************************
export const loginAdmin = tryCatchFunction(async (req: Request<{}, {}, loginDataType>, res: Response, next: NextFunction) => {

    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) return next(new ErrorHandler("Please enter all fields", 400));

    try {
        const connection = await db.getConnection();

        try {
            const values = [phoneOrEmail, phoneOrEmail]

            const [row] = await connection.query<RowDataPacket[]>(`SELECT ADMIN_ID,FIRST_NAME,PHONE ,EMAIL,PASSWORD FROM ADMINS WHERE PHONE=? OR EMAIL=?`, values)
            connection.release();
            if (row.length === 0) return next(new ErrorHandler("User does not exists", 404));


            const isValidPassword = await bcrypt.compare(password, row[0].PASSWORD);
            if (!isValidPassword) return next(new ErrorHandler("Wrong Password.", 401));

            const token = jwt.sign({ admin_id: row[0].ADMIN_ID }, process.env.JWT_SECRET as string, { expiresIn: '10d' });

            res.cookie('adminAuthToken', token, {
                maxAge: 10 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            })



            res.status(201).json({
                success: true,
                message: `Welcome Back ${row[0].FIRST_NAME}! `
            })


        } catch (error) {
            connection.release();
            console.error("Error during login:", error);
            return next(new ErrorHandler("DB request failed Try again", 500))

        }
    } catch {
        return next(new ErrorHandler("Failed to get database connection.", 500));
    }

})

// logout admin *********************************************************************************************
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


export const adminProfileData = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const admin_id = getAdminId(req, res, next);
    // console.log(admin_id);

    const connection = await db.getConnection();
    const query = `SELECT ADMIN_ID,FIRST_NAME,LAST_NAME,PHONE,EMAIL,HOSTEL_NAME,STATE,DISTRICT,TOWN_NAME,PINCODE FROM ADMINS WHERE ADMIN_ID=?`;
    const values = [admin_id];
    const [rows] = await connection.query<RowDataPacket[]>(query, values);
    connection.release();
    res.status(200).json({
        success: true,
        admin: rows[0]
    })
})

export const updateAdminProfile = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const admin_id = req.params.id;

    const { updateValue, attributeType } = req.body;
    if (!admin_id || !updateValue || !attributeType) {
        return next(new ErrorHandler("Please provide all required fields.", 400));
    }

    // Allowed attributes to update
    const allowedAttributes: Record<string, string> = {
        FIRST_NAME: "First name",
        LAST_NAME: "Last name",
        PHONE: "Phone",
        EMAIL: "Email",
        HOSTEL_NAME: "Hostel name",
        STATE: "State",
        DISTRICT: "District",
        PINCODE: "Pincode",
        TOWN_NAME: "Town name",
        GENDER: "Gender"
    };

    if (!allowedAttributes[attributeType]) {
        return next(new ErrorHandler("Invalid attribute type.", 400));
    }

    // Basic validation for phone/email if needed
    if (attributeType === "PHONE" && !validator.isMobilePhone(String(updateValue), 'en-IN')) {
        return next(new ErrorHandler("Please enter valid phone number.", 400));
    }
    if (attributeType === "EMAIL" && !validator.isEmail(updateValue)) {
        return next(new ErrorHandler("Please enter valid email Id.", 400));
    }

    const connection = await db.getConnection();
    try {
        const query = `UPDATE ADMINS SET ${attributeType}=? WHERE ADMIN_ID=?`;

        await connection.query(query, [updateValue, admin_id]);
        connection.release();

        res.status(200).json({
            success: true,
            updatedData: { attributeType, updateValue },
            message: `${allowedAttributes[attributeType]} updated successfully.`
        });
    } catch (error) {
        connection.release();
        return next(new ErrorHandler("Failed to update profile.", 500));
    }
});

