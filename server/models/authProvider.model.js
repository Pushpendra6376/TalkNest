import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './user.model.js';

const AuthProvider = sequelize.define('AuthProvider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  provider: {
    type: DataTypes.ENUM('google', 'facebook'),
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, { timestamps: true });

// Relations
User.hasMany(AuthProvider);
AuthProvider.belongsTo(User);

export default AuthProvider;