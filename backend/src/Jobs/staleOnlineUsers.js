import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "../models/user.model.js";

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Finds users whose isOnline flag is still true but haven't had any activity
 * for more than 1 hour (based on updatedAt). This handles the edge case where
 * a socket disconnect event failed to fire (e.g. server crash, network drop,
 * ungraceful client close), leaving the user permanently marked as online.
 *
 * Fix: was using MongoDB syntax (updateMany, $lt, $set pipeline) which crashes
 * in a Sequelize/MySQL project. Rewritten using Sequelize's User.update() API.
 */
const cleanupStaleOnlineUsers = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - INTERVAL_MS);

    // Fix: Sequelize does not support updating one column to the value of
    // another column in a simple update object. We fetch stale users first
    // and use their actual updatedAt as the lastSeen value, then bulk-update.
    const staleUsers = await User.findAll({
      where: {
        isOnline: true,
        updatedAt: { [Op.lt]: oneHourAgo },
      },
      attributes: ["id", "updatedAt"],
    });

    if (staleUsers.length === 0) return;

    // Update each stale user: set isOnline=false, lastSeen=their real updatedAt
    // Use a transaction for consistency
    await sequelize.transaction(async (t) => {
      for (const user of staleUsers) {
        await User.update(
          { isOnline: false, lastSeen: user.updatedAt },
          { where: { id: user.id }, transaction: t }
        );
      }
    });

    console.log(
      `[staleOnlineUsers] Marked ${staleUsers.length} stale user(s) as offline.`
    );
  } catch (error) {
    console.error("[staleOnlineUsers] Job failed:", error.message);
  }
};

/**
 * Starts the recurring job. Runs once immediately on startup (so stale users
 * from a previous server crash are cleaned up right away), then repeats every
 * hour.
 */
const startStaleOnlineUsersJob = () => {
  console.log("[staleOnlineUsers] Job started — runs every 1 hour.");

  // Run once immediately on server start to clean up any leftovers from a
  // previous crash or ungraceful shutdown
  cleanupStaleOnlineUsers();

  // Then repeat on a fixed interval
  setInterval(cleanupStaleOnlineUsers, INTERVAL_MS);
};

export { startStaleOnlineUsersJob };