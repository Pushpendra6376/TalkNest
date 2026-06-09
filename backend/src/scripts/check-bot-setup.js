/**
 * check-bot-setup.js
 * Verifies the bot conversation is set up correctly
 */

import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

const run = async () => {
  try {
    await connectDB();

    console.log("\n📋 Checking Bot Conversation Setup\n");

    // Get conversation 26
    const conversation = await Conversation.findByPk(26);
    
    if (!conversation) {
      console.log("❌ Conversation 26 not found");
      process.exit(1);
    }

    console.log(`✅ Conversation 26 found`);
    console.log(`   Members: ${JSON.stringify(conversation.members)}`);

    // Get the members
    for (const memberId of conversation.members) {
      const user = await User.findByPk(memberId);
      console.log(`\n   User ID: ${memberId}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   isBot: ${user.isBot}`);
    }

    console.log("\n✅ Setup verification complete\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

run();
