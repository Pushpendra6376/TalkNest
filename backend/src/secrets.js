import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using gemini-3.5-flash - latest and most optimized flash model
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET = process.env.AWS_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://talknest-chatting.netlify.app";

export {
  CORS_ORIGIN,
  JWT_SECRET,
  AWS_ACCESS_KEY,
  AWS_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  EMAIL,
  PASSWORD,
  AWS_BUCKET_NAME,
  FRONTEND_URL,
};