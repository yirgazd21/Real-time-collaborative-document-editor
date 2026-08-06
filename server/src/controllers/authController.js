const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { validatePasswordStrength } = require("../utils/password");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

/**
 * Helper to set access & refresh tokens in HTTP-only cookies and return JSON payload
 */
const sendAuthResponse = (user, statusCode, res, message) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  const accessToken = generateAccessToken(user, sessionId);
  const refreshToken = generateRefreshToken(user, sessionId);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    refreshToken,
    user: user.toJSON ? user.toJSON() : user,
  });
};

// register user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.",
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: "local",
    });

    return sendAuthResponse(user, 201, res, "Registration successful");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return sendAuthResponse(user, 200, res, "Login successful");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Continue with Google OAuth Authentication
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID Token is required",
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(googleClientId);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      console.error("Google Token Verification Error:", tokenErr.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google ID Token: " + tokenErr.message,
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Link Google ID if registered via local email previously
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        avatar: picture || "",
        authProvider: "google",
      });
    }

    return sendAuthResponse(user, 200, res, "Google authentication successful");
  } catch (error) {
    console.error("Google Auth Backend Exception:", error);
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const token =
      req.body.refreshToken ||
      (req.cookies ? req.cookies.refreshToken : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing",
      });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newAccessToken = generateAccessToken(user, decoded.sessionId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc    Logout user & clear cookies
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const sendEmail = require("../utils/sendEmail");

/**
 * @desc    Generate password reset token & link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "There is no account associated with this email address",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log("\n=======================================================");
    console.log(`🔑 PASSWORD RESET LINK FOR: ${user.email}`);
    console.log(`URL: ${resetUrl}`);
    console.log("=======================================================\n");

    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6366f1; font-size: 24px; margin: 0;">SyncWrite Collab</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
        </div>
        <p style="color: #1e293b; font-size: 15px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to reset your password for your SyncWrite Collab account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Or copy and paste this link into your web browser:</p>
        <p style="word-break: break-all; font-size: 12px; color: #6366f1;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This link will expire in 10 minutes. If you did not request a password reset, please ignore this message.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "SyncWrite - Password Reset Request",
        message: `Reset your SyncWrite password by opening this link: ${resetUrl}`,
        html: htmlMessage,
      });

      return res.status(200).json({
        success: true,
        message: "Password reset instructions sent to your email address",
        resetUrl,
      });
    } catch (emailErr) {
      console.error("Email dispatch failed:", emailErr.message);
      // Fallback: Return success so local dev resets work via console link
      return res.status(200).json({
        success: true,
        message: "Password reset token created (Logged to server console)",
        resetUrl,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using reset token
 * @route   POST /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password",
      });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.",
      });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  refreshToken,
  getCurrentUser,
  logoutUser,
  forgotPassword,
  resetPassword,
};
