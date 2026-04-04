import express from "express";
import {
  createConversation,
  getConversation,
  getConversationList,
  togglePin,
} from "../controllers/conversation.controller.js";
import fetchuser from "../middlewares/fetchUser.js";

const router = express.Router();

router.post("/", fetchuser, createConversation);
router.get("/", fetchuser, getConversationList);
router.get("/:id", fetchuser, getConversation);
router.post("/:id/pin", fetchuser, togglePin);

export default router;