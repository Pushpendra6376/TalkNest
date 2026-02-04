import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Otp = sequelize.define('Otp', {
  identifier: { // Email or Phone
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('VERIFICATION', 'RESET_PASSWORD', 'DELETE_ACCOUNT'),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
});

export default Otp;