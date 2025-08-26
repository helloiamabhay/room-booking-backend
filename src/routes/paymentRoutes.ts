import express from "express"
import { getAccessToken, initiatePayment, refundPayment, verifyPayment } from "../controllers/paymentController.js";


const router = express.Router();


router.route("/create-payment").post(initiatePayment);
router.route("/verify-payment/:orderId").get(verifyPayment);
router.route("/refund-payment").post(refundPayment);

export default router

