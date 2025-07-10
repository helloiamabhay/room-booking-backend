import express from "express";
import { createUser, loginUser, logoutUser } from "../controllers/userController.js";
import { authUser } from "../middleware/userAuthentication.js";
import { getRoomDetails, searchingRooms } from "../controllers/roomControllers.js";
import { get } from "http";

const router = express.Router()

router.route("/register").post(createUser)
router.route("/login").post(loginUser)
router.route("/logout").get(logoutUser)
router.route("/user-auth").get(authUser)
router.route("/room-searching").post(searchingRooms)
router.route("/get-room-details/:id").get(getRoomDetails)




export default router
