const User = require('../models/User'); // User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "This email isn't in our nest yet!" });
        }

        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Oops! Wrong password." });
        }

        // 3. Create Token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error. Try again later." });
    }
};