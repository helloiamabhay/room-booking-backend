import { db } from "../app.js";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import validator from "validator";
import ErrorHandler from "../middleware/customError.js";
import jwt from "jsonwebtoken";
// create admin *********************************************************************************************
export const createAdmin = tryCatchFunction(async (req, res, next) => {
    const { first_name, last_name, phone, email, password, hostel_name, state, district, town_name, pinCode, gender } = req.body;
    // validate inputs
    if (!first_name || !phone || !email || !password || !hostel_name || !state || !district || !town_name || !pinCode || !gender)
        return next(new ErrorHandler("Please enter All fields!", 400));
    // validate phone and email
    if (!validator.isMobilePhone(String(phone), 'en-IN'))
        return next(new ErrorHandler("Please enter valid phone number.", 400));
    if (!validator.isEmail(email))
        return next(new ErrorHandler("Please enter valid email Id.", 400));
    try {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.query(`SELECT PHONE,EMAIL FROM ADMINS WHERE PHONE=? OR EMAIL=?`, [phone, email]);
            connection.release();
            if (rows.length > 0) {
                return next(new ErrorHandler("User already exists!", 400));
            }
            // Hashing password
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin_id = uuidv4();
            // Insert new admin
            const query = `INSERT INTO ADMINS (ADMIN_ID, FIRST_NAME, LAST_NAME, PHONE, EMAIL, PASSWORD, HOSTEL_NAME,STATE, DISTRICT,PINCODE ,TOWN_NAME, GENDER) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;
            const values = [admin_id, first_name, last_name, phone, email, hashedPassword, hostel_name, state, district, pinCode, town_name, gender];
            await connection.query(query, values);
            connection.release();
            const token = jwt.sign({ admin_id }, process.env.JWT_SECRET, { expiresIn: '10d' });
            // set cookie with jwt token
            res.cookie('adminAuthToken', token, {
                maxAge: 10 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });
            res.status(201).json({
                success: true,
                message: `Dear ${first_name},Account created!`
            });
        }
        catch (error) {
            connection.release();
            return next(new ErrorHandler("DB request failed Try again: " + error, 500));
        }
    }
    catch (error) {
        return next(new ErrorHandler("Failed to get database connection.", 500));
    }
});
// login admin  *********************************************************************************************
export const loginAdmin = tryCatchFunction(async (req, res, next) => {
    const { phoneOrEmail, password } = req.body;
    if (!phoneOrEmail || !password)
        return next(new ErrorHandler("Please enter all fields", 400));
    try {
        const connection = await db.getConnection();
        try {
            const values = [phoneOrEmail, phoneOrEmail];
            const [row] = await connection.query(`SELECT ADMIN_ID,FIRST_NAME,PHONE ,EMAIL,PASSWORD FROM ADMINS WHERE PHONE=? OR EMAIL=?`, values);
            connection.release();
            if (row.length === 0)
                return next(new ErrorHandler("User does not exists", 404));
            const isValidPassword = await bcrypt.compare(password, row[0].PASSWORD);
            if (!isValidPassword)
                return next(new ErrorHandler("Wrong Password.", 401));
            const token = jwt.sign({ admin_id: row[0].ADMIN_ID }, process.env.JWT_SECRET, { expiresIn: '10d' });
            res.cookie('adminAuthToken', token, {
                maxAge: 10 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            });
            res.status(201).json({
                success: true,
                message: `Welcome Back ${row[0].FIRST_NAME}! `
            });
        }
        catch (error) {
            connection.release();
            console.error("Error during login:", error);
            return next(new ErrorHandler("DB request failed Try again", 500));
        }
    }
    catch {
        return next(new ErrorHandler("Failed to get database connection.", 500));
    }
});
// logout admin *********************************************************************************************
export const adminLogout = tryCatchFunction(async (req, res, next) => {
    res.clearCookie('adminAuthToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    });
    res.status(200).json({
        success: true,
        message: "Logged Out Seccessfully!"
    });
});
