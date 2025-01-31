import express from "express"
import { payment } from "../controllers/experiment.js";


const router = express.Router();

router.route("/payment").post(payment);

export default router

