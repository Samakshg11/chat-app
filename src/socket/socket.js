const { Server } = require("socket.io");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

/**
 * Socket helpers and initialization.
 *
 * Notes for clients: prefer enabling automatic reconnect with exponential
 * backoff (e.g. `reconnection: true`, `reconnectionAttempts`, `reconnectionDelay`).
 * Server-side options such as `pingInterval` and `pingTimeout` can be tuned
 * via the `Server` constructor if needed for large deployments.
 */

let io;
const onlineUsers = new Map();
const socketToUser = new Map();
const normalizeString = (v) => (v === null || v === undefined ? "" : String(v).trim());
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(normalizeString(value));
const resolveJoinUserId = (payload) => {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") return normalizeString(payload.userId) || null;
  return null;
};

const getUserSocketIds = (userId) => Array.from(onlineUsers.get(String(userId)) || []);
const isUserOnline = (userId) => getUserSocketIds(userId).length > 0;
const addUserSocket = (userId, socketId) => {
  const normalizedUserId = String(userId);
  const sockets = onlineUsers.get(normalizedUserId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(normalizedUserId, sockets);
  socketToUser.set(socketId, normalizedUserId);
};
const removeUserSocket = (socketId) => {
  const userId = socketToUser.get(socketId);
  if (!userId) {
    return;
  }

  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.set(userId, sockets);
    }
  }

  socketToUser.delete(socketId);
};
const buildPresencePayload = () => ({
  onlineCount: onlineUsers.size,
  onlineUserIds: Array.from(onlineUsers.keys()),
});
const getOnlineUserIds = () => Array.from(onlineUsers.keys());
const emitPresenceUpdate = () => {
  if (!io) {
    return;
  }
  io.emit("presence:update", buildPresencePayload());
};

function initSocket(server) {
  const corsOrigin = process.env.SOCKET_CORS_ORIGIN || "*";

  io = new Server(server, {
    cors: { origin: corsOrigin } // cors allow kr diya
  });

  io.on("connection", (socket) => {
    logger.info("socket:connected", socket.id);
    socket.emit("presence:snapshot", buildPresencePayload());

    socket.on("join", (payload) => {
      const joinedUserId = resolveJoinUserId(payload);
      const normalizedUserId = joinedUserId ? String(joinedUserId) : null;
      if (!isValidObjectId(normalizedUserId)) {
        socket.emit("join:error", { message: "Invalid user id" });
        return;
      }

      addUserSocket(normalizedUserId, socket.id);
      emitPresenceUpdate();
    });

    socket.on("leave", () => {
      removeUserSocket(socket.id);
      emitPresenceUpdate();
    });

    socket.on("disconnect", () => {
      if (socketToUser.has(socket.id)) {
        removeUserSocket(socket.id);
        emitPresenceUpdate();
      }
      logger.info("socket:disconnected", socket.id);
    });
  });
}

// io return karega
function getIO() {
  return io;
}

function emitToUser(userId, eventName, payload) {
  if (!io || !userId) {
    return;
  }
  const userSocketIds = getUserSocketIds(userId);
  userSocketIds.forEach((socketId) => io.to(socketId).emit(eventName, payload));
}

/**
 * Emit an event to all sockets for a given user id.
 * Safe to call when the socket server is not initialized.
 * @param {string} userId
 * @param {string} eventName
 * @param {any} payload
 */

module.exports = initSocket;
module.exports.getIO = getIO; 
module.exports.onlineUsers = onlineUsers; 
module.exports.emitToUser = emitToUser;
module.exports.isUserOnline = isUserOnline;
module.exports.getOnlineUserIds = getOnlineUserIds;
