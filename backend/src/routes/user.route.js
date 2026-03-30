import express from "express";
import { getUserById, searchUsers, updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protectRoute);

router.get("/search", searchUsers);
router.get("/:id", getUserById);
router.put("/update-profile", updateProfile);

export default router;