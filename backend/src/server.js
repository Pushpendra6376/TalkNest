import express from "express";
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import path from "path";
 
// models
import "./models/user.model.js";
import "./models/message.model.js";
import "./models/groups.model.js";
import "./models/groupMembers.model.js";
import "./models/groupMessages.model.js";
import "./models/index.js"; // for associations


dotenv.config();

const app = express();
const __dirname = path.resolve();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); //req.body 

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userRoutes);

console.log(process.env.NODE_ENV);

// make ready for deployment
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) =>{
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    })
}

connectDB().then(async () => {
  await sequelize.sync({ force: true })

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});