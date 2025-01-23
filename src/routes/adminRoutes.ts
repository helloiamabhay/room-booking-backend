import express from "express"
import { adminLogout, createAdmin, loginAdmin } from "../controllers/adminController.js";
import { deleteRoom, getAdminRooms, roomController, searchingRooms, updatePhoto, updateRoom } from "../controllers/roomControllers.js";
import { authAdmin } from "../middleware/userAuthentication.js";
import { deletePhotofunction } from "../middleware/room_photo_uploads.js";



const router = express.Router();

router.route("/admin-register").post(createAdmin)
router.route("/admin-login").post(loginAdmin)
router.route("/logout").get(adminLogout)
router.route("/create-room").post(authAdmin, roomController)
router.route("/admin-rooms").get(getAdminRooms)
router.route("/delete-photo").delete(authAdmin, deletePhotofunction)
router.route("/update-room/:id").put(authAdmin, updateRoom)
router.route("/update-photo/:id").post(authAdmin, updatePhoto)
router.route("/delete-room").delete(authAdmin, deleteRoom)
router.route("/room-searching").get(searchingRooms)








export default router
