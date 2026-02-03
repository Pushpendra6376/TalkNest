import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("TalkNest Backend is running");
});

const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`TalkNest backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
