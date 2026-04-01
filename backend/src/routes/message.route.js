import express from "express";
import multer from "multer";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  updateMessageStatus,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = express.Router();

router.use(protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", upload.single('media'), sendMessage);
router.post("/status/:id", updateMessageStatus);

export default router;