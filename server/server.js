import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet"; // Security headers ke liye
import { connectDB, sequelize } from "./config/db.js";

// Routes Import
import authRoutes from "./routes/auth.routes.js";

//Models Import
import "./models/user.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

//Security & Config Middleware
app.use(helmet()); // HTTP Headers secure 
app.use(cors({
    origin: "http://localhost:5173", //Frontend URL
    credentials: true // Agar cookies/sessions future me use karein
}));
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true }));

// API Routes 
app.get("/", (req, res) => {
    res.send("TalkNest Backend is running securely 🚀");
});

// Auth Routes
app.use("/api/auth", authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// Server Startup & DB Connection
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        // Connect to DB
        await connectDB();

        // Step B: Sync Models 
        // alter: true -> Agar model me kuch change ho toh table update karega bina data udaye
        // force: false -> Table drop nahi karega (Production ke liye safe)
        await sequelize.sync({ force: false, alter: true });
        console.log("All Database Tables Synced Successfully");

        // Start Server
        server.listen(PORT, () => {
            console.log(`TalkNest Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server failed to start:", error.message);
        process.exit(1);
    }
};

startServer();