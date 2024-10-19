import express from "express";
import { createUser, loginUser, logoutUser } from "../controllers/userController.js";
const router = express.Router();
router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
export default router;
