const { Server } = require("socket.io");
const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");
const registerDocHandlers = require("./docHandler");

/**
 * Initializes and attaches Socket.IO to the HTTP server
 * @param {import("http").Server} httpServer - Node HTTP server instance
 * @returns {import("socket.io").Server} Configured Socket.IO instance
 */
const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      // Parse cookie fallback if token not explicitly passed in handshake auth
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";");
        for (const cookie of cookies) {
          const [key, val] = cookie.trim().split("=");
          if (key === "accessToken") {
            token = val;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // Socket Connection Handler
  io.on("connection", (socket) => {
    console.log(
      `🟢 Socket Connected: ${socket.id} (User: ${socket.user.name} - ${socket.user.email})`
    );

    // Register Document Real-time Event Handlers
    registerDocHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(
        `🔴 Socket Disconnected: ${socket.id} (User: ${socket.user.name}) - Reason: ${reason}`
      );
    });
  });

  return io;
};

module.exports = { initSocketServer };
