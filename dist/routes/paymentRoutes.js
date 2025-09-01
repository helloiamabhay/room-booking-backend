import express from "express";
import { initiatePayment, verifyPayment } from "../controllers/paymentController.js";
import { authUser } from "../middleware/authentication.js";
const router = express.Router();
router.route("/create-payment/:room_id").post(initiatePayment);
router.route("/verify-payment/:orderId").get(authUser, verifyPayment);
// router.route("/refund-payment").post(authUser, refundPayment);
export default router;
