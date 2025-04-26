import express from "express";
import { PhonepeGateway } from "../controllers/paymentController.js";
const router = express.Router();
router.route("/payment").get(PhonepeGateway);
export default router;
