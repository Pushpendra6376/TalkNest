import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    // Password null ho sakta hai agar user sirf OAuth (Google/FB) se aaye
    allowNull: true, 
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  profilePic: {
    type: DataTypes.STRING,
  },
}, { timestamps: true });

export default User;