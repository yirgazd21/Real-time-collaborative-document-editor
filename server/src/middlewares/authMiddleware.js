const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");

/**
 * Protects routes requiring authentication.
 * Extracts JWT from Authorization header or HTTP-only cookies.
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no access token provided",
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Find user in DB by decoded subject (userId)
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    // Attach user and sessionId to request object
    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Access token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
    });
  }
};

module.exports = { protect };
