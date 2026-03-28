import express from "express";
import { updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protectRoute);

router.put("/update-profile", updateProfile);

export default router;