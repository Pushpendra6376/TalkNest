import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // 1️⃣ Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * decoded payload example:
     * {
     *   userId: "uuid-string",
     *   iat: 1710000000,
     *   exp: 1710003600
     * }
     */

    // 4️⃣ Attach user info to request
    req.user = {
      id: decoded.userId
    };

    // 5️⃣ Continue
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export default authMiddleware;
