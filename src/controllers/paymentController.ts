import axios from 'axios';
import { tryCatchFunction } from '../middleware/errorHandler.js';
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../middleware/customError.js';
import { v4 as uuidv4 } from 'uuid';
import { getUserId } from '../middleware/authentication.js';
import { db } from '../app.js';
import { RowDataPacket } from 'mysql2';
import jwt, { JwtPayload } from 'jsonwebtoken';


export const getAccessToken = async (): Promise<string | null> => {
    try {
        const body = new URLSearchParams({
            client_version: process.env.PAY_CLIENT_VERSION || "1",
            grant_type: "client_credentials",
            client_id: process.env.PAY_CLIENT_ID!,
            client_secret: process.env.PAY_CLIENT_SECRET!,
        });

        const response = await axios.post(
            `${process.env.PAY_BASE_URL}/v1/oauth/token`,
            body.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const accessToken = response.data.access_token || null;


        return accessToken;

    } catch (error: any) {
        console.error("❌ Failed to fetch token:", error.response?.data || error.message);
        return null;
    }
};

export const initiatePayment = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {

    const { redirectUrl } = req.body;
    const room_id = req.params.room_id;
    const payment_id = uuidv4();
    const merchantOrderId = uuidv4();
    const user_id = getUserId(req, res, next);
    const token = await getAccessToken();



    if (!token || !user_id) {
        throw new Error('Unable to get access token or user ID');
    }

    const amountQuery = `SELECT PRICE FROM ROOMS WHERE ROOM_ID = ?`;
    const [rows] = await db.query<RowDataPacket[]>(amountQuery, [room_id]);
    const amount = rows[0]?.PRICE;

    if (!amount || !room_id || !user_id) return next(new ErrorHandler("Missing required payment information", 400));

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
    };


    const body = {
        amount: amount * 100,
        expireAfter: 1200, // in seconds (20 min)
        metaInfo: {
            udf1: 'room-booking',
            udf2: user_id,// user_id
            udf3: payment_id,// payment_id
        },
        paymentFlow: {
            type: 'PG_CHECKOUT',
            message: 'Payment for room booking',
            merchantUrls: {
                "redirectUrl": redirectUrl as string,
            },
        },
        merchantOrderId: merchantOrderId,
    };

    try {
        const response = await axios.post(
            `${process.env.PAY_BASE_URL}/checkout/v2/pay`,
            body,
            { headers }
        )

        const connection = await db.getConnection();
        try {
            const Query = `INSERT INTO PAYMENTS (PAYMENT_ID,USER_ID, ROOM_ID, ORDER_ID, AMOUNT, PAYMENT_STATUS) VALUES (?, ?, ?, ?, ?, ?)`;


            const values = [payment_id, user_id, room_id, merchantOrderId, amount, 'PENDING'];
            // console.log("Inserting payment record:", values);
            await connection.query(Query, values);
            connection.release();
        } catch (error) {
            connection.release();
            console.error("Error inserting payment record:", error);
        }

        res.status(200).json({
            check_order_id: merchantOrderId,
            redirect_url: response.data.redirectUrl
        })
        return response.data;
    } catch (err: any) {
        console.error('❌ Payment Error:', err);
        throw err;
    }
})
// Verify Payment Status after redirect
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    const room_id = req.query.room_id as string;

    if (!orderId || !room_id) return next(new ErrorHandler("Missing orderId or roomId to verify payment", 400));

    try {
        // Get user information from token ==============================================
        const [token, userToken] = await Promise.all([
            getAccessToken(),
            Promise.resolve(req.cookies['userAuthToken'])
        ])

        if (!userToken || !token) return next(new ErrorHandler("Not Authenticated! ", 401))
        let user_name: string;
        try {
            const decoded = jwt.verify(userToken, process.env.JWT_SECRET as string);
            user_name = (decoded as JwtPayload).first_name as string;

        } catch {
            return next(new ErrorHandler("Invalid token. Please login again!", 401));
        }

        const response = await axios.get(
            `${process.env.PAY_BASE_URL}/checkout/v2/order/${orderId}/status`,
            {
                headers: {
                    "Content-Type": 'application/json',
                    "Authorization": `O-Bearer ${token}`,
                },
            }
        );
        const user_id = response.data?.metaInfo?.udf2;
        const payment_id = response.data?.metaInfo?.udf3;
        const paymentStatus = response.data?.paymentDetails[0]?.state;
        const transactionId = response.data?.paymentDetails[0]?.transactionId;
        const paymentMode = response.data?.paymentDetails[0]?.paymentMode;
        const amount = response.data?.paymentDetails[0]?.amount;

        const date_time = new Date().toString()
        const newDateValue = new Date();

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const paymentQuery = `UPDATE PAYMENTS SET PAYMENT_STATUS = ?,PAYMENT_MODE=?,TRANSACTION_ID = ?,PAYMENT_DATE=? WHERE ORDER_ID = ?`;
            const bookingsQuery = `UPDATE BOOKINGS SET USER_ID=?, BOOKING_STATUS = ?,PAYMENT_STATUS=?,PAYMENT_DATE=?,AVAILABILITY_DATE=? WHERE ROOM_ID = ?`;
            const roomUpdateQuery = `UPDATE ROOMS SET AVAILABILITYDATE = ? WHERE ROOM_ID = ?`;

            const paymentValues = [paymentStatus, paymentMode, transactionId, newDateValue, orderId];
            const bookingValues = [user_id, "CONFIRMED", "PAID", newDateValue, null, room_id];

            await connection.query(paymentQuery, paymentValues);
            await connection.query(bookingsQuery, bookingValues);
            await connection.query(roomUpdateQuery, [null, room_id]);
            await connection.commit();
            connection.release();
        } catch (error) {
            await connection.rollback();
            connection.release();

            return res.status(500).json({ error: `Failed to update payment status: ${error}` });
        }

        return res.status(200).json({
            success: true,
            payment_id,
            user_name,
            paymentStatus,
            transactionId,
            paymentMode,
            amount,
            date_time
        });
    } catch (err: any) {

        return res.status(500).json({ error: `Failed to verify payment` });
    }
};

export const refundPayment = async (req: Request, res: Response) => {
    const { orderId, refundAmount } = req.body;

    const token = await getAccessToken();
    if (!token) return res.status(500).json({ error: 'Failed to get access token' });

    try {
        const response = await axios.post(
            `${process.env.PAY_BASE_URL}/checkout/v2/refund`,
            { orderId, refundAmount, reason: "Customer requested refund and room booking canceled" },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.status(200).json({ refunded: true, details: response.data });
    } catch (err: any) {
        console.error('Refund payment error:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to refund payment' });
    }
};
