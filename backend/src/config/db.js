import {Sequelize} from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database Connected Successfully ");
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        // Exit the process so the server doesn't start in a broken state
        process.exit(1);
    }
};

export {sequelize, connectDB };