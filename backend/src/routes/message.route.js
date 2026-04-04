import express from "express";
import {
  allMessage,
  deleteMessage,
  bulkHide,
  clearChat,
  toggleStar,
  getStarredMessages,
} from "../controllers/message.controller.js";
import fetchuser from "../middlewares/fetchUser.js";

const router = express.Router();

router.get("/starred", fetchuser, getStarredMessages);
router.get("/:id", fetchuser, allMessage);
router.delete("/bulk/hide", fetchuser, bulkHide);
router.delete("/:id", fetchuser, deleteMessage);
router.post("/clear/:conversationId", fetchuser, clearChat);
router.post("/:id/star", fetchuser, toggleStar);

export default router;