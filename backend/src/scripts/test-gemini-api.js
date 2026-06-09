/**
 * test-gemini-api.js
 * Creates an AI bot user and conversation for Alice Summers, then tests the chat.
 * 
 * Usage:
 *   node src/scripts/test-gemini-api.js
 */

import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { GEMINI_MODEL } from "../secrets.js";

const run = async () => {
  try {
    await connectDB();
    
    console.log(`\n✅ Testing Gemini API with model: ${GEMINI_MODEL}\n`);

    // Find Alice Summers
    const alice = await User.findOne({
      where: { email: "alicesummers@talknest-test.dev" },
    });

    if (!alice) {
      console.log("❌ Alice Summers not found. Please seed test users first.");
      process.exit(1);
    }

    console.log(`✅ Found user: ${alice.name} (ID: ${alice.id})`);
    console.log(`✅ Current Gemini Model: ${GEMINI_MODEL}`);

    // Check if Alice already has a bot conversation
    const existingConversation = await Conversation.findOne({
      where: {
        members: JSON.stringify([alice.id, alice.id]), // dummy check
      },
      raw: true,
    });

    // Create a test bot user directly without checking for existing conversations
    // (simpler approach for testing)

    // Create a test bot user
    const testBot = await User.create({
      name: "Gemini Test Bot",
      email: `bot.test.${Date.now()}@talknest.internal`,
      password: "test123", // dummy password
      about: "Testing gemini-3.5-flash model",
      profilePic:
        "https://play-lh.googleusercontent.com/Oe0NgYQ63TGGEr7ViA2fGA-yAB7w2zhMofDBR3opTGVvsCFibD8pecWUjHBF_VnVKNdJ",
      isBot: true,
      isEmailVerified: true,
    });

    console.log(`✅ Created test bot: ${testBot.name} (ID: ${testBot.id})`);

    // Create a conversation between Alice and the bot
    const conversation = await Conversation.create({
      members: [alice.id, testBot.id],
      unreadCounts: [
        { userId: alice.id, count: 0 },
        { userId: testBot.id, count: 0 },
      ],
    });

    console.log(
      `✅ Created conversation (ID: ${conversation.id}) between Alice and the bot`
    );
    console.log(`\n📝 Test Configuration:`);
    console.log(`   - User: ${alice.name} (${alice.email})`);
    console.log(`   - Bot: ${testBot.name} (${testBot.email})`);
    console.log(`   - Conversation ID: ${conversation.id}`);
    console.log(`   - Gemini Model: ${GEMINI_MODEL}`);
    console.log(`\n✅ Bot conversation created successfully!`);
    console.log(`\nYou can now:`);
    console.log(`1. Log in with Alice's account (alicesummers@talknest-test.dev / Test@1234)`);
    console.log(`2. Go to the conversations page`);
    console.log(`3. Open the conversation with "Gemini Test Bot"`);
    console.log(`4. Send a message to test if the Gemini API responds\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

run();
