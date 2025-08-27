import express from "express";
import { initiatePayment, refundPayment, verifyPayment } from "../controllers/paymentController.js";
const router = express.Router();
router.route("/create-payment/:room_id").post(initiatePayment);
router.route("/verify-payment/:orderId").get(verifyPayment);
router.route("/refund-payment").post(refundPayment);
export default router;
