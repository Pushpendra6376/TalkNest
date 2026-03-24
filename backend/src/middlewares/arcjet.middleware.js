import arcjet from "@arcjet/node";

// Initialize Arcjet
export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Rate limiting: 10 requests per minute per IP
    arcjet.rateLimit({
      mode: "LIVE",
      match: "/api/messages/*",
      window: "1m",
      max: 10,
    }),
    // Rate limiting for auth endpoints: 5 requests per minute per IP
    arcjet.rateLimit({
      mode: "LIVE",
      match: "/api/auth/*",
      window: "1m",
      max: 5,
    }),
    // Bot protection
    arcjet.botProtect({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:PREVIEW",
        "CATEGORY:MONITOR",
      ],
    }),
  ],
});

// Middleware function for Express
export const arcjetProtection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, // Number of tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: decision.reason.resetInSeconds,
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Bot detected.",
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }
    }

    // Add Arcjet decision to request for potential use in controllers
    req.arcjet = decision;

    next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    // If Arcjet fails, allow the request to continue (fail-open)
    next();
  }
};