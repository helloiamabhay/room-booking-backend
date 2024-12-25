import express from "express"
import { adminLogout, createAdmin, loginAdmin } from "../controllers/adminController.js";
import { getAdminRooms, photoUploadController, roomController } from "../controllers/roomControllers.js";
import { authAdmin } from "../middleware/userAuthentication.js";
import { createRoomAndUploadPhoto } from "../controllers/experiment.js";
import multer from "multer";
import { upload_func } from "../middleware/room_photo_uploads.js";

const router = express.Router();

router.route("/admin-register").post(createAdmin)
router.route("/admin-login").post(loginAdmin)
router.route("/logout").get(adminLogout)
// router.route("/create-room").post(authAdmin, roomController)
router.route("/create-room").post(authAdmin, createRoomAndUploadPhoto)

router.route("/upload-photo").post(authAdmin, photoUploadController)
router.route("/admin-rooms").get(getAdminRooms)





export default router
