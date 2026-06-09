/**
 * fix-bot-setup.js
 * Fixes the bot user's isBot field
 */

import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";

const run = async () => {
  try {
    await connectDB();

    console.log("\n🔧 Fixing Bot Setup\n");

    // Update the Test Bot User to have isBot = true
    const result = await User.update(
      { isBot: true },
      { where: { id: 30 } }
    );

    console.log(`✅ Updated Test Bot User (ID: 30) to isBot: true`);

    // Verify the update
    const botUser = await User.findByPk(30);
    console.log(`✅ Verification: isBot = ${botUser.isBot}`);

    console.log(`\n✅ Bot setup fixed!\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

run();
