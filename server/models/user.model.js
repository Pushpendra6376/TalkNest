const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Email uniqueness check
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Phone uniqueness check
        validate: {
            // Indian 10-digit number validation logic
            is: {
                args: /^[0-9]{10}$/,
                msg: "Phone number must be exactly 10 digits."
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = User;