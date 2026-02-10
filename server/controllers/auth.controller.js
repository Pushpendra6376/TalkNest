import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../models/user.model.js";

export const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully!",
            user: { id: user.id, name: user.name }
        });

    } catch (error) {
            //console.error("REGISTER ERROR 👉", error); // ADD THIS

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "Email or Phone already exists!" });
        }

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        //console.log("LOGIN BODY 👉", req.body);
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { phone: identifier }
                ]
            }
        });

        //console.log("USER FOUND 👉", user?.email);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials!" });
        }
        //console.log("PASSWORD MATCH 👉", isMatch);
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        //console.log("JWT_SECRET 👉", process.env.JWT_SECRET);

        res.json({
            token,
            user: { id: user.id, name: user.name }
        });

    } catch (error) {
        console.error("LOGIN ERROR", error);
        res.status(500).json({ message: "Login failed" });
    }
};
