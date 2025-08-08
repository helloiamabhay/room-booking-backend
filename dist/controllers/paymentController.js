import axios from 'axios';
import { tryCatchFunction } from '../middleware/errorHandler.js';
import ErrorHandler from '../middleware/customError.js';
export const getAccessToken = async () => {
    try {
        const body = new URLSearchParams({
            client_version: process.env.PAY_CLIENT_VERSION || "1",
            grant_type: "client_credentials",
            client_id: process.env.PAY_CLIENT_ID,
            client_secret: process.env.PAY_CLIENT_SECRET,
        });
        const response = await axios.post(`${process.env.PAY_BASE_URL}/v1/oauth/token`, body.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const accessToken = response.data.access_token || null;
        return accessToken;
    }
    catch (error) {
        console.error("❌ Failed to fetch token:", error.response?.data || error.message);
        return null;
    }
};
export const initiatePayment = tryCatchFunction(async (req, res, next) => {
    const { amount, orderId, redirectUrl } = req.body;
    if (!amount || !orderId || !redirectUrl)
        return next(new ErrorHandler("Missing required payment parameters", 400));
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
            udf2: 'user-id-optional',
        },
        paymentFlow: {
            type: 'PG_CHECKOUT',
            message: 'Payment for room booking',
            merchantUrls: {
                redirectUrl,
            },
        },
        merchantOrderId: orderId,
    };
    try {
        const response = await axios.post(`${process.env.PAY_BASE_URL}/checkout/v2/pay`, body, { headers });
        res.status(200).json({
            data: response.data
        });
        return response.data;
    }
    catch (err) {
        console.error('❌ Payment Error:', err);
        throw err;
    }
});
// Verify Payment Status after redirect
export const verifyPayment = async (req, res) => {
    const { merchantOrderId } = req.params;
    const token = await getAccessToken();
    if (!token)
        return res.status(500).json({ error: 'Failed to get access token' });
    try {
        const response = await axios.get(`${process.env.PAY_BASE_URL}/checkout/v2/status/${merchantOrderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        const paymentStatus = response.data.status; // e.g. 'SUCCESS', 'FAILURE'
        if (paymentStatus === 'SUCCESS') {
        }
    }
    catch (err) {
        console.error('Verify payment error:', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to verify payment' });
    }
};
