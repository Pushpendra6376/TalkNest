import express from "express";
import { updateProfile } from "../controllers/user.controller.js"; 

const router = express.Router();

router.put("/update-profile", updateProfile);

export default router;