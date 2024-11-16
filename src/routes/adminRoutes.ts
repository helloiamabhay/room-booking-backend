import express from "express"
import { adminLogout, createAdmin, getId, loginAdmin } from "../controllers/adminController.js";
import { roomController } from "../controllers/roomControllers.js";

const router = express.Router();

router.route("/admin-register").post(createAdmin)
router.route("/admin-login").post(loginAdmin)
router.route("/logout").get(adminLogout)
router.route("/create-room").post(roomController)






export default router
