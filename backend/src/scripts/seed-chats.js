/**
 * seed-chats.js
 * Creates 20 test users, and for each test user, creates a conversation with a real user
 * containing 20 incoming and 20 outgoing messages (40 total messages per chat).
 *
 * Usage:
 *   node src/scripts/seed-chats.js
 */

import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const TEST_EMAIL_SUFFIX = "@talknest-test.dev";
const TEST_PASSWORD = "Test@1234"; // shared password for all test users

const TEST_USERS = [
    { name: "Alice Summers",    about: "Coffee addict ☕ | Travel lover ✈️" },
    { name: "Bob Harrington",   about: "Full-stack dev by day, gamer by night 🎮" },
    { name: "Clara Nguyen",     about: "Designer & dreamer 🎨" },
    { name: "David Okonkwo",    about: "Entrepreneur & fitness junkie 💪" },
    { name: "Eva Petrov",       about: "ML engineer | cat person 🐱" },
    { name: "Frank Müller",     about: "Outdoor enthusiast 🏕️" },
    { name: "Grace Liu",        about: "Bookworm 📚 | Tea > coffee" },
    { name: "Hiro Tanaka",      about: "Anime fan & React developer ⚛️" },
    { name: "Isla MacGregor",   about: "Photographer capturing life 📷" },
    { name: "Jake Torres",      about: "Startup founder | pizza connoisseur 🍕" },
    { name: "Kayla Robinson",   about: "Nurse by profession, dancer at heart 💃" },
    { name: "Liam O'Brien",     about: "DevOps nerd ☁️ | Rugby fan 🏉" },
    { name: "Mia Andersson",    about: "Sustainability advocate 🌱" },
    { name: "Noah Smith",       about: "Backend wizard 🧙 | coffee over sleep" },
    { name: "Olivia Carter",    about: "Marketing guru & dog mom 🐶" },
    { name: "Pedro Alves",      about: "Football ⚽ | Mobile developer" },
    { name: "Quinn Andrews",    about: "Non-binary | artist & activist 🏳️‍🌈" },
    { name: "Rachel Kim",       about: "Chef-in-training 🍳 | food blogger" },
    { name: "Sam Patel",        about: "Security researcher 🔐" },
    { name: "Tina Brooks",      about: "UX researcher | coffee shop hopper ☕" },
];

const OUTGOING_MESSAGES = [
    "Hey! How's your day going?",
    "Did you see the new design for the dashboard?",
    "Are we still on for the meeting at 3 PM?",
    "I just pushed the latest updates to github.",
    "Let me know if you need any help with the setup.",
    "Have you tried the new coffee shop near the office?",
    "What do you think about the project timeline?",
    "I'll send you the document in a few minutes.",
    "Let's catch up later tonight.",
    "Can you review my PR when you get a chance?",
    "Perfect, thanks for the quick response!",
    "Are you working from home today?",
    "Could you send me the API keys?",
    "Let's schedule a call for tomorrow morning.",
    "No worries, take your time.",
    "That sounds like a great idea!",
    "I'm currently working on the database indexing.",
    "We should definitely add this to the backlog.",
    "Is the backend server running locally?",
    "See you in a bit!"
];

const INCOMING_MESSAGES = [
    "Hey! It's going pretty well, thanks. How about yours?",
    "Yes, I checked it. Looks clean and modern!",
    "Absolutely, I'll be there.",
    "Awesome, I will pull the changes right away.",
    "Sure, I'll let you know if I run into any issues.",
    "Not yet, is it good? I might go there tomorrow.",
    "I think it's realistic, but we need to verify the API layer.",
    "Sounds good, I'll keep an eye out for it.",
    "Definitely, let's grab dinner or drinks.",
    "Sure, I'll take a look at it right after this task.",
    "You're welcome! Happy to help.",
    "Yes, avoiding the commute today.",
    "Sent them over on Slack, check your DM.",
    "Sounds good. Does 10 AM work for you?",
    "Thanks, almost done with the bug fix.",
    "Glad you like it! I can start drafting the specs.",
    "Nice! That should speed up the message loading time.",
    "Agreed. I'll create a ticket for it now.",
    "Yes, port 3000 is open and working.",
    "See you there!"
];

const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const run = async () => {
    await connectDB();

    console.log("Searching for a real user (main account)...");
    // Find the first user who is not a test user and not a bot
    let realUser = await User.findOne({
        where: {
            email: {
                [Op.notLike]: `%${TEST_EMAIL_SUFFIX}`
            },
            isBot: false
        }
    });

    if (!realUser) {
        console.log("No real user found! Creating a default real user (user@talknest.com)...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        realUser = await User.create({
            name: "Main User",
            email: "user@talknest.com",
            password: hashedPassword,
            about: "Using TalkNest! 🚀",
            isEmailVerified: true,
            profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent("Main User")}&background=random&bold=true`
        });
    }

    console.log(`Using real user: ${realUser.name} <${realUser.email}> (ID: ${realUser.id})`);

    const salt = await bcrypt.genSalt(10);
    const testPasswordHashed = await bcrypt.hash(TEST_PASSWORD, salt);

    // Clean up existing test users, their conversations, and messages first
    console.log("\nCleaning up existing test data...");
    const existingTestUsers = await User.findAll({
        where: {
            email: {
                [Op.like]: `%${TEST_EMAIL_SUFFIX}`
            }
        }
    });

    const testUserIds = existingTestUsers.map(u => u.id);
    if (testUserIds.length > 0) {
        // Find conversations involving test users
        // Since members is a JSON array, we can load all conversations and filter them in JS
        const conversations = await Conversation.findAll();
        const testConvIds = conversations
            .filter(c => {
                const members = typeof c.members === "string" ? JSON.parse(c.members) : c.members;
                return members.some(mId => testUserIds.includes(mId));
            })
            .map(c => c.id);

        if (testConvIds.length > 0) {
            const deletedMsgs = await Message.destroy({
                where: {
                    conversationId: {
                        [Op.in]: testConvIds
                    }
                }
            });
            console.log(`  🗑 Deleted ${deletedMsgs} old test message(s).`);

            const deletedConvs = await Conversation.destroy({
                where: {
                    id: {
                        [Op.in]: testConvIds
                    }
                }
            });
            console.log(`  🗑 Deleted ${deletedConvs} old test conversation(s).`);
        }

        const deletedUsers = await User.destroy({
            where: {
                id: {
                    [Op.in]: testUserIds
                }
            }
        });
        console.log(`  🗑 Deleted ${deletedUsers} old test user(s).`);
    }

    console.log("\nSeeding 20 test users, conversations, and messages...");
    let usersCreated = 0;
    let messagesCreated = 0;

    for (const u of TEST_USERS) {
        const email = `${toSlug(u.name)}${TEST_EMAIL_SUFFIX}`;
        const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&bold=true`;

        // Create test user
        const testUser = await User.create({
            name: u.name,
            email,
            password: testPasswordHashed,
            about: u.about,
            profilePic,
            isEmailVerified: true
        });
        usersCreated++;

        // Create 1-to-1 conversation
        const membersList = [realUser.id, testUser.id];
        const unreadCountsList = [
            { userId: realUser.id, count: 0 },
            { userId: testUser.id, count: 0 }
        ];

        const conversation = await Conversation.create({
            members: membersList,
            latestmessage: "",
            unreadCounts: unreadCountsList
        }, { validate: false });

        // Seed 20 incoming + 20 outgoing messages (total 40)
        // Alternating to simulate back-and-forth chat.
        // Incremental timestamps so they sort chronologically.
        const baseTime = Date.now() - 40 * 60 * 60 * 1000; // 40 hours ago

        let lastMessageText = "";
        for (let i = 0; i < 20; i++) {
            // Outgoing message (real user -> test user)
            const outText = OUTGOING_MESSAGES[i] || `Message ${i + 1} from ${realUser.name}`;
            const outTime = new Date(baseTime + (2 * i) * 60 * 60 * 1000);
            
            await Message.create({
                conversationId: conversation.id,
                senderId: realUser.id,
                text: outText,
                seenBy: [{ userId: realUser.id, seenAt: outTime }, { userId: testUser.id, seenAt: outTime }],
                createdAt: outTime,
                updatedAt: outTime
            });
            messagesCreated++;

            // Incoming message (test user -> real user)
            const inText = INCOMING_MESSAGES[i] || `Message ${i + 1} from ${testUser.name}`;
            const inTime = new Date(baseTime + (2 * i + 1) * 60 * 60 * 1000);
            
            await Message.create({
                conversationId: conversation.id,
                senderId: testUser.id,
                text: inText,
                seenBy: [{ userId: realUser.id, seenAt: inTime }, { userId: testUser.id, seenAt: inTime }],
                createdAt: inTime,
                updatedAt: inTime
            });
            messagesCreated++;
            lastMessageText = inText;
        }

        // Update latest message in conversation
        await conversation.update({
            latestmessage: lastMessageText,
            updatedAt: new Date()
        });

        console.log(`  ✨ Seeded chat with ${testUser.name} (${email}) - 40 messages`);
    }

    console.log(`\nSeed completed!`);
    console.log(`- Created ${usersCreated} test users.`);
    console.log(`- Seeded ${usersCreated} conversations.`);
    console.log(`- Created ${messagesCreated} total messages (20 incoming & 20 outgoing per user).`);
    process.exit(0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
