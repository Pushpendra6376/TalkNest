const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Password Hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // User creation (Sequelize automatically throws error if unique constraint fails)
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
        // Handle Uniqueness and Validation Errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Email or Phone already exists!" });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: "Server Error" });
    }
};

exports.login = async (req, res) => {
    const { identifier, password } = req.body; // email or phone
    try {
        const { Op } = require('sequelize');
        const user = await User.findOne({ 
            where: {
                [Op.or]: [{ email: identifier }, { phone: identifier }]
            }
        });

        if (!user) return res.status(404).json({ message: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials!" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name } });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
};