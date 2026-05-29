/**
 * delete-test-users.js
 * Removes all test users whose email ends in @talknest-test.dev.
 * Also deletes any conversations those users belong to and all
 * messages inside those conversations.
 *
 * Usage:
 *   node src/scripts/delete-test-users.js
 *
 * Fix: was entirely written using MongoDB syntax (User.find, $regex, $in,
 * deleteMany, _id) — completely rewritten using Sequelize API.
 */

import { connectDB, sequelize } from "../config/db.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { Op } from "sequelize";

// Import models so Sequelize registers associations before any query
import "../models/user.model.js";
import "../models/message.model.js";
import "../models/conversation.model.js";

const TEST_EMAIL_SUFFIX = "@talknest-test.dev";

const run = async () => {
  await connectDB();
  await sequelize.sync();

  // 1. Find all test users
  const testUsers = await User.findAll({
    where: {
      email: { [Op.like]: `%${TEST_EMAIL_SUFFIX}` },
    },
    attributes: ["id", "email"],
  });

  if (testUsers.length === 0) {
    console.log("No test users found — nothing to delete.");
    process.exit(0);
  }

  const testUserIds = testUsers.map((u) => u.id);
  console.log(`Found ${testUsers.length} test user(s).`);

  // 2. Find conversations that include any test user.
  // members is a JSON column — we fetch all conversations and filter in JS
  // because MySQL's JSON_CONTAINS only supports a single value at a time.
  const allConversations = await Conversation.findAll({
    attributes: ["id", "members"],
  });

  const affectedConvIds = allConversations
    .filter((c) =>
      (c.members || []).some((m) => testUserIds.includes(Number(m)))
    )
    .map((c) => c.id);

  console.log(`Found ${affectedConvIds.length} conversation(s) involving test users.`);

  await sequelize.transaction(async (t) => {
    // 3. Delete messages in those conversations
    if (affectedConvIds.length > 0) {
      const msgCount = await Message.destroy({
        where: { conversationId: { [Op.in]: affectedConvIds } },
        transaction: t,
      });
      console.log(`  🗑  Deleted ${msgCount} message(s).`);

      // 4. Delete the conversations themselves
      const convCount = await Conversation.destroy({
        where: { id: { [Op.in]: affectedConvIds } },
        transaction: t,
      });
      console.log(`  🗑  Deleted ${convCount} conversation(s).`);
    }

    // 5. Delete the test users
    const userCount = await User.destroy({
      where: { id: { [Op.in]: testUserIds } },
      transaction: t,
    });
    console.log(`  🗑  Deleted ${userCount} test user(s).`);
  });

  console.log("\nClean-up complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});