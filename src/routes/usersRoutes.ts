import express from "express";
import { createUser, loginUser, logoutUser } from "../controllers/userController.js";
import { authUser } from "../middleware/userAuthentication.js";

const router = express.Router()

router.route("/register").post(createUser)
router.route("/login").post(loginUser)
router.route("/logout").get(logoutUser)
router.route("/user-auth").get(authUser)



export default router
