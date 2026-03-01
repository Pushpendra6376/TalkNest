import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./user.model.js";
import Group from "./groups.model.js";

const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Group,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    role: {
      type: DataTypes.ENUM("admin", "member"),
      defaultValue: "member",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["groupId", "userId"], // ek user ek group me sirf ek baar
      },
    ],
  }
);


export default GroupMember;