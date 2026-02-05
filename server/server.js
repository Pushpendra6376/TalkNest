import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet"; // Security headers ke liye
import { connectDB, sequelize } from "./config/db.js";

// Routes Import
import authRoutes from "./routes/auth.routes.js";

// Models Import (Zaroori hai taaki Sequelize unhe recognize kare aur tables banaye)
import "./models/user.model.js";
import "./models/otp.model.js";
import "./models/authProvider.model.js";
import "./models/passwordReset.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- 1. Security & Config Middleware ---
app.use(helmet()); // HTTP Headers secure karta hai
app.use(cors({
    origin: "http://localhost:5173", // Frontend URL (Vite default)
    credentials: true // Agar cookies/sessions future me use karein
}));
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true }));

// --- 2. API Routes ---
app.get("/", (req, res) => {
    res.send("TalkNest Backend is running securely 🚀");
});

// Auth Routes mount karna
app.use("/api/auth", authRoutes);

// --- 3. Global Error Handler (App crash hone se bachata hai) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// --- 4. Server Startup & DB Connection ---
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        // Step A: Connect to DB
        await connectDB();

        // Step B: Sync Models (Tables create/update karna)
        // alter: true -> Agar model me kuch change ho toh table update karega bina data udaye
        // force: false -> Table drop nahi karega (Production ke liye safe)
        await sequelize.sync({ force: true, alter: false });
        console.log("All Database Tables Synced Successfully");

        // Step C: Start Server
        server.listen(PORT, () => {
            console.log(`TalkNest Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server failed to start:", error.message);
        process.exit(1);
    }
};

startServer();