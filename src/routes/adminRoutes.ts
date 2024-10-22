import express from "express"
import { adminLogout, createAdmin, loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.route("/admin-register").post(createAdmin)
router.route("/admin-login").post(loginAdmin)
router.route("/logout").get(adminLogout)



export default router
