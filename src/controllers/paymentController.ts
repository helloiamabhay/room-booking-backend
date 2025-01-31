import { NextFunction, Request, Response } from "express";
import { tryCatchFunction } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import ErrorHandler from "../middleware/customError.js";



export const PhonepeGatway = tryCatchFunction(async (req: Request, res: Response, next: NextFunction) => {
    const MERCHANT_ID = "PGTESTPAYUAT";
    const SALT_INDEX = 1;
    const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const PHONE_PE_UAT_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    const PAYENDPOINT = "/pg/v1/pay";
    const USER_ID = "123abc"
    const MERCHANT_USER_ID = uuidv4()
    const payload = {
        "merchantId": MERCHANT_ID,
        "merchantTransactionId": MERCHANT_USER_ID,
        "merchantUserId": "MUID123",
        "amount": 1000,
        "redirectUrl": `http://localhost/redirect-url/${MERCHANT_USER_ID}`,
        "redirectMode": "REDIRECT",
        // "callbackUrl": "https://webhook.site/callback-url",
        "mobileNumber": "9999999999",
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    }

    const bufferObj = Buffer.from(JSON.stringify(payload), 'utf-8');
    const base64EncodedString = bufferObj.toString('base64');
    // const xVerify= sha256(base64EncodedString + PAYENDPOINT + SALT_KEY)+"###"+SALT_INDEX;
    const xVerify = crypto.createHash('sha256').update(base64EncodedString + PAYENDPOINT + SALT_KEY).digest('hex') + "###" + SALT_INDEX;


    const options = {
        method: "POST",
        url: `${PHONE_PE_UAT_URL}${PAYENDPOINT}`,
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-Verify": xVerify,
        },
        data: {
            request: base64EncodedString
        }
    }


    const response = await fetch(`{PHONE_PE_UAT_URL}${PAYENDPOINT}`, options)
    const data = await response.json();

    if (!response.ok) {
        return next(new ErrorHandler(data.message, response.status))
    }
    res.status(200).json({
        success: true,
        data
    })

})