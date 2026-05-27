const { Server } = require("socket.io");
const mongoose = require("mongoose");

let io;
const onlineUsers = new Map();
const socketToUser = new Map();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getUserSocketIds = (userId) => Array.from(onlineUsers.get(String(userId)) || []);
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
const emitPresenceUpdate = () => {
  io.emit("presence:update", {
    onlineCount: onlineUsers.size,
    onlineUserIds: Array.from(onlineUsers.keys()),
  });
};

function initSocket(server) {

  io = new Server(server, {
    cors: { origin: "*" } // cors allow kr diya
  });

  io.on("connection", (socket) => {
    console.log("User Connected"); // connect hua

    socket.on("join", (userId) => {
      const normalizedUserId = String(userId);
      if (!isValidObjectId(normalizedUserId)) {
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
      console.log("User Disconnected"); 
    });
  });
}

// io return karega
function getIO() {
  return io;
}

function emitToUser(userId, eventName, payload) {
  const userSocketIds = getUserSocketIds(userId);
  userSocketIds.forEach((socketId) => io.to(socketId).emit(eventName, payload));
}

module.exports = initSocket;
module.exports.getIO = getIO; 
module.exports.onlineUsers = onlineUsers; 
module.exports.emitToUser = emitToUser;
