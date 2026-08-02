const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = "15m",
  JWT_REFRESH_EXPIRES_IN = "7d",
} = process.env;

// Validate required environment variables
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined."
  );
}

const JWT_OPTIONS = {
  issuer: "syncwrite-api",
  audience: "syncwrite-client",
};

// Generate Access Token
const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      sessionId,
    },
    JWT_ACCESS_SECRET,
    {
      ...JWT_OPTIONS,
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user, sessionId) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      sessionId,
    },
    JWT_REFRESH_SECRET,
    {
      ...JWT_OPTIONS,
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    }
  );
};

// Hash refresh token before storing in the database
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Verify Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, JWT_OPTIONS);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, JWT_OPTIONS);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
};