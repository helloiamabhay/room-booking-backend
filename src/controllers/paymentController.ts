// import { application, NextFunction, Request, Response } from "express";
// import { tryCatchFunction } from "../middleware/errorHandler.js";
// import { v4 as uuidv4 } from 'uuid';

// import * as crypto from 'crypto';
// import ErrorHandler from "../middleware/customError.js";
// import sha256 from "sha256";

// import NodeCache from "node-cache";
// import axios from 'axios';



// const MERCHANT_ID = "PGTESTPAYUAT";
// const SALT_INDEX = 1;
// const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
// const PHONE_PE_UAT_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
// const PAYENDPOINT = "/pg/v1/pay";
// const USER_ID = "123abc"
// export const PhonepeGatway = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
//     const MERCHANT_USER_ID = uuidv4()
//     const payload = {
//         merchantId: MERCHANT_ID,
//         merchantUserId: USER_ID,
//         mobileNumber: "9999999999",
//         amount: 10000,
//         merchantTransactionId: MERCHANT_USER_ID,
//         redirectUrl: `http://localhost:2000/redirect-url/${MERCHANT_USER_ID}`,
//         redirectMode: "POST",
//         // callbackUrl: "https://localhost:2000/callback-url",
//         paymentInstrument: {
//             type: "PAY_PAGE"
//         }
//     }
//     console.log("xyz");

//     const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
//     const base64EncodedString = bufferObj.toString("base64");

//     // const xVerify= sha256(base64EncodedString + PAYENDPOINT + SALT_KEY)+"###"+SALT_INDEX;
//     // const hash = crypto.createHash('sha256')
//     // const xVerify = hash.update(`${base64EncodedString}${PAYENDPOINT}${SALT_KEY}`).digest('hex') + "###" + SALT_INDEX;
//     const sha256var = sha256(base64EncodedString + "/pg/v1/pay" + SALT_KEY)
//     const xVerify = sha256var + "###" + SALT_INDEX

//     const options = {
//         method: 'POST',
//         url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
//         headers: {
//             accept: 'application/json',
//             "Content-Type": 'application/json',
//             "X-VERIFY": xVerify,
//         },
//         data: {
//             request: base64EncodedString
//         },
//     }


//     try {
//         console.log("ok");

//         const response = await axios.request(options);
//         console.log(response);

//         const data = response.data;
//         // Handle the successful response here
//         // console.log("Response Data:", data);
//         res.status(200).json({
//             success: true,
//             data,
//         });
//     } catch (error) {
//         // Handle errors here
//         next(new ErrorHandler("PhonePe API request failed" + error, 500));
//     }

// })

import { Request, Response, NextFunction } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import ErrorHandler from "../middleware/customError.js";
import axios from 'axios';
import dotenv from 'dotenv';
import { error } from "console";

// dotenv.config();

// Environment variables for sensitive data
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = "1";
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const PHONE_PE_UAT_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PAYENDPOINT = "/pg/v1/pay";
const USER_ID = "123abc";

export const PhonepeGateway = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
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
    }

    // Encode the payload to base64
    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base64EncodedString = bufferObj.toString("base64");

    // Calculate the X-VERIFY header
    const dataToHash = base64EncodedString + "/pg/v1/pay" + SALT_KEY;
    const sha256Hash = createHash('sha256').update(dataToHash).digest('hex');
    const xVerify = sha256Hash + "###" + SALT_INDEX

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
        const response = await axios.post(`${PHONE_PE_UAT_URL}${PAYENDPOINT}`,
            { request: base64EncodedString },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerify,
                    accept: "application/json",
                }
            }
        );

        console.log("response->", response);
        res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    } catch (err: any) {
        if (err.response && err.response.status === 429) {
            console.log('Rate limit hit, retrying...');
            res.status(429).send({ error: 'Rate limit hit, please try again later.' });
        } else {
            console.error('Payment failed:', err.message);
            res.status(500).send({ error: 'Payment failed, please try again later.' });
        }
    }


});
