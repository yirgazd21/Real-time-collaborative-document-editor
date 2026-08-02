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

// CORS Configuration
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
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
