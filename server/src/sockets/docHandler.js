const Document = require("../models/Document");
const Revision = require("../models/Revision");

// In-memory room presence store: documentId -> Map(socketId -> userData)
const roomPresenceMap = new Map();

/**
 * Socket.IO Handler for Document Real-time Collaboration & Presence
 * @param {import("socket.io").Server} io - Socket.IO Server instance
 * @param {import("socket.io").Socket} socket - Authenticated socket connection
 */
module.exports = (io, socket) => {
  const user = socket.user; // Attached by socket auth middleware

  /**
   * Handle joining a document room
   */
  socket.on("join-document", async ({ documentId }) => {
    if (!documentId) return;

    const roomName = `document:${documentId}`;
    socket.join(roomName);
    socket.currentDocumentId = documentId;

    // Track presence in room
    if (!roomPresenceMap.has(documentId)) {
      roomPresenceMap.set(documentId, new Map());
    }

    const roomUsers = roomPresenceMap.get(documentId);
    const userInfo = {
      socketId: socket.id,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      cursor: null,
      selection: null,
      joinedAt: new Date(),
    };

    roomUsers.set(socket.id, userInfo);

    // Broadcast updated presence list to all users in the document room
    const presenceList = Array.from(roomUsers.values());
    io.to(roomName).emit("presence-update", presenceList);

    // Notify room of user arrival
    socket.to(roomName).emit("user-joined", userInfo);
  });

  /**
   * Handle broadcasting real-time document changes / deltas
   */
  socket.on("send-changes", ({ documentId, delta, content, title }) => {
    const roomName = `document:${documentId}`;
    // Broadcast changes immediately to all other connected collaborators in room
    socket.to(roomName).emit("receive-changes", { delta, content, title });
  });

  /**
   * Handle real-time comment synchronization
   */
  socket.on("comment-action", ({ documentId }) => {
    const roomName = `document:${documentId}`;
    socket.to(roomName).emit("comment-updated");
  });

  /**
   * Handle live cursor movement tracking
   */
  socket.on("cursor-move", ({ documentId, cursor, selection }) => {
    const roomUsers = roomPresenceMap.get(documentId);
    if (roomUsers && roomUsers.has(socket.id)) {
      const userInfo = roomUsers.get(socket.id);
      userInfo.cursor = cursor;
      userInfo.selection = selection;
      roomUsers.set(socket.id, userInfo);
    }

    const roomName = `document:${documentId}`;
    socket.to(roomName).emit("cursor-update", {
      socketId: socket.id,
      userId: user._id.toString(),
      name: user.name,
      cursor,
      selection,
    });
  });

  /**
   * Handle typing indicators
   */
  socket.on("typing", ({ documentId, isTyping }) => {
    const roomName = `document:${documentId}`;
    socket.to(roomName).emit("user-typing", {
      userId: user._id.toString(),
      name: user.name,
      isTyping,
    });
  });

  /**
   * Handle real-time auto-saving of document content to MongoDB
   */
  socket.on("save-document", async ({ documentId, content, title }) => {
    try {
      if (!documentId) return;

      const document = await Document.findById(documentId);
      if (!document) return;

      // Check if user has editor or owner access
      const accessLevel = document.getUserAccessLevel(user._id);
      if (accessLevel !== "owner" && accessLevel !== "editor") {
        socket.emit("save-error", { message: "Unauthorized to edit document" });
        return;
      }

      if (title !== undefined) document.title = title;
      if (content !== undefined) document.content = content;
      document.lastModifiedBy = user._id;

      await document.save();
      await document.populate("lastModifiedBy", "name email avatar");

      const roomName = `document:${documentId}`;
      // Broadcast save success & updated metadata to ALL connected users in room
      io.to(roomName).emit("save-success", {
        savedAt: document.updatedAt,
        lastModifiedBy: document.lastModifiedBy,
        title: document.title,
        message: "Changes saved automatically",
      });
    } catch (err) {
      socket.emit("save-error", { message: err.message });
    }
  });

  /**
   * Handle explicit document room leave
   */
  const handleLeaveDocument = () => {
    const documentId = socket.currentDocumentId;
    if (!documentId) return;

    const roomName = `document:${documentId}`;
    socket.leave(roomName);

    const roomUsers = roomPresenceMap.get(documentId);
    if (roomUsers) {
      roomUsers.delete(socket.id);
      if (roomUsers.size === 0) {
        roomPresenceMap.delete(documentId);
      } else {
        const presenceList = Array.from(roomUsers.values());
        io.to(roomName).emit("presence-update", presenceList);
      }
    }

    socket.to(roomName).emit("user-left", {
      socketId: socket.id,
      userId: user._id.toString(),
      name: user.name,
    });

    socket.currentDocumentId = null;
  };

  socket.on("leave-document", handleLeaveDocument);
  socket.on("disconnect", handleLeaveDocument);
};
