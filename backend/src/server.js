import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import path from "path";

dotenv.config();

const app = express();
const __dirname = path.resolve();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); 

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

console.log(process.env.NODE_ENV);

// make ready for deployment
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) =>{
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    })
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});