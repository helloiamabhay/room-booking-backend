import express from "express"
import { getAccessToken, initiatePayment } from "../controllers/paymentController.js";


const router = express.Router();

router.route("/payment").get(getAccessToken);
router.route("/create-payment").post(initiatePayment);

export default router

