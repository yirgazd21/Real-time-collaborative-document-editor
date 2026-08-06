const { Server } = require("socket.io");
const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");
const registerDocHandlers = require("./docHandler");

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, "") : "";
  if (clientUrl && origin === clientUrl) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000") return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  return false;
};

// Initializes and attaches Socket.IO to the HTTP server

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS blocked for origin: ${origin}`));
        }
      },
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
