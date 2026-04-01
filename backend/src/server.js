import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { connectDB, sequelize } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import { initSocket } from "./config/socket.js";
import path from "path";
 
// models
import "./models/user.model.js";
import "./models/message.model.js";


dotenv.config();

const app = express();
const __dirname = path.resolve();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userRoutes);

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large. Maximum allowed size is 50MB.' });
    }

    return res.status(500).json({ message: err.message || 'Server error' });
  });

  console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) =>{
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    })
}

connectDB().then(async () => {
  await sequelize.sync({ alter: true });
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});