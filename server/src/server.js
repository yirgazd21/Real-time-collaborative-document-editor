require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Import API Routers
const authRoutes = require("./routes/authRoutes");
const docRoutes = require("./routes/docRoutes");
const versionRoutes = require("./routes/versionRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Import Middlewares
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

// Import Socket Manager
const { initSocketServer } = require("./sockets/socketManager");

// Initialize Database Connection
connectDB();

const app = express();

// Smart CORS Configuration (Supports Vercel deployments & localhost)
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow server-to-server or non-browser tools like Postman
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, "") : "";
  if (clientUrl && origin === clientUrl) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000") return true;
  if (/\.vercel\.app$/.test(origin)) return true; // Dynamically allow all Vercel deployment previews
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Standard Body Parsers & Cookie Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "up",
    message: "SyncWrite Collaborative API Server is running",
    timestamp: new Date(),
  });
});

// API Routes Wireup
app.use("/api/auth", authRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/documents/:docId/revisions", versionRoutes);
app.use("/api/documents/:docId/comments", commentRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Create HTTP Server & Socket.IO Instance
const server = http.createServer(app);
const io = initSocketServer(server);

// Attach Socket.IO instance to Express app for controller broadcasts
app.set("io", io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
  =======================================================
  🚀 SYNCWRITE SERVER READY ON PORT: ${PORT}
  🌍 CORS CLIENT ORIGIN: ${CLIENT_URL}
  ⚡ SOCKET.IO WEBSOCKET ENGINE ONLINE
  =======================================================
  `);
});
