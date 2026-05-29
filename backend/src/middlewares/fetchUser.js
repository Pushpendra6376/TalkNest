import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets.js";

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    console.log("token not found");
    // Fix: was returning plain text — now returns JSON to match all other routes
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  } else {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      console.error(error.message);
      // Fix: was returning plain text — now returns JSON to match all other routes
      return res.status(401).json({ error: "Please authenticate using a valid token" });
    }
  }
};

export default fetchuser;