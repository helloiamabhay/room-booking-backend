// import { application, NextFunction, Request, Response } from "express";
// import { tryCatchFunction } from "../middleware/errorHandler.js";
// import { v4 as uuidv4 } from 'uuid';
import { tryCatchFunction } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import axios from 'axios';
// dotenv.config();
// Environment variables for sensitive data
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = "1";
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const PHONE_PE_UAT_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PAYENDPOINT = "/pg/v1/pay";
const USER_ID = "123abc";
export const PhonepeGateway = tryCatchFunction(async (req, res, next) => {
    const MERCHANT_USER_ID = uuidv4();
    // Construct the payload
    const payload = {
        "merchantId": "PGTESTPAYUAT86",
        "merchantTransactionId": "MT7850590068188104",
        "merchantUserId": "MUID123",
        "amount": 100,
        "redirectUrl": "https://localhost:2000/redirect-url",
        "redirectMode": "REDIRECT",
        "mobileNumber": "9999999999",
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    };
    // Encode the payload to base64
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64EncodedString = bufferObj.toString("base64");
    // Calculate the X-VERIFY header
    const dataToHash = base64EncodedString + "/pg/v1/pay" + SALT_KEY;
    const sha256Hash = createHash('sha256').update(dataToHash).digest('hex');
    const xVerify = sha256Hash + "###" + SALT_INDEX;
    // Set up the request options
    // const options = {
    //     method: 'POST',
    //     url: `${PHONE_PE_UAT_URL}${PAYENDPOINT}`,
    //     headers: {
    //         "Content-Type": 'application/json',
    //         "X-VERIFY": xVerify,
    //         "accept": 'application/json',
    //     },
    //     data: {
    //         request: base64EncodedString
    //     },
    // };
    // Send the request to PhonePe API
    try {
        const response = await axios.post(`${PHONE_PE_UAT_URL}${PAYENDPOINT}`, { request: base64EncodedString }, {
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                accept: "application/json",
            }
        });
        console.log("response->", response);
        res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    }
    catch (err) {
        if (err.response && err.response.status === 429) {
            console.log('Rate limit hit, retrying...');
            res.status(429).send({ error: 'Rate limit hit, please try again later.' });
        }
        else {
            console.error('Payment failed:', err.message);
            res.status(500).send({ error: 'Payment failed, please try again later.' });
        }
    }
});
