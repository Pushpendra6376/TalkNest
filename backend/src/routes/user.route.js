import express from "express";
import fetchuser from "../middlewares/fetchUser.js";
import {
  getPresignedUrl,
  getOnlineStatus,
  getNonFriendsList,
  updateprofile,
  blockUser,
  unblockUser,
  getBlockStatus,
  deleteAccount,
} from "../controllers/user.controller.js";

const router = express.Router();

router.put("/update", fetchuser, updateprofile);
router.get("/online-status/:id", fetchuser, getOnlineStatus);
router.get("/non-friends", fetchuser, getNonFriendsList);
router.get("/presigned-url", fetchuser, getPresignedUrl);
router.post("/block/:id", fetchuser, blockUser);
router.delete("/block/:id", fetchuser, unblockUser);
router.get("/block-status/:id", fetchuser, getBlockStatus);
router.delete("/delete", fetchuser, deleteAccount);

export default router;