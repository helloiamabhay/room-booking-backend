import axios from 'axios';
import { tryCatchFunction } from '../middleware/errorHandler.js';
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../middleware/customError.js';
import { v4 as uuidv4 } from 'uuid';
import { getUserId } from '../middleware/authentication.js';
import { db } from '../app.js';


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

    const { amount, redirectUrl } = req.body;
    const room_id = req.params.room_id;
    console.log(room_id);

    const payment_id = uuidv4();
    const merchantOrderId = uuidv4();
    const user_id = getUserId(req, res, next);

    if (!amount || !redirectUrl || !room_id || !user_id) return next(new ErrorHandler("Missing required payment parameters", 400));

    const token = await getAccessToken();


    if (!token) {
        throw new Error('Unable to get access token');
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
    };

    const body = {
        amount,
        expireAfter: 1200, // in seconds (20 min)
        metaInfo: {
            udf1: 'room-booking',
            udf2: `user-id : ${user_id}`,
        },
        paymentFlow: {
            type: 'PG_CHECKOUT',
            message: 'Payment for room booking',
            merchantUrls: {
                "redirectUrl": redirectUrl,
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


            const values = [payment_id, user_id, room_id, merchantOrderId, amount, 'INITIATED'];
            // console.log("Inserting payment record:", values);
            await connection.query(Query, values);
            connection.release();
            console.log("Payment record inserted successfully");
        } catch (error) {
            connection.release();
            console.error("Error inserting payment record:", error);
        }

        res.status(200).json({
            data: response.data
        })
        return response.data;
    } catch (err: any) {
        console.error('❌ Payment Error:', err);
        throw err;
    }
})
// Verify Payment Status after redirect
export const verifyPayment = async (req: Request, res: Response) => {
    const { orderId } = req.params;


    const token = await getAccessToken();
    if (!token) return res.status(500).json({ error: 'Failed to get access token' });

    try {
        const response = await axios.get(
            `${process.env.PAY_BASE_URL}/checkout/v2/order/${orderId}/status`,
            {
                headers: {
                    "Content-Type": 'application/json',
                    "Authorization": `O-Bearer ${token}`,
                },
            }
        );


        const paymentStatus = response.data.status; // e.g. 'SUCCESS', 'FAILURE'



        return res.status(200).json({ status: paymentStatus, data: response.data });
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
