import express from "express";
import { getUserById, updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protectRoute);

router.get("/:id", getUserById);
router.put("/update-profile", updateProfile);

export default router;