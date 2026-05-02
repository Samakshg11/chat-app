const { Server } = require("socket.io");
const mongoose = require("mongoose");

let io;
const onlineUsers = new Map(); 
const socketToUser = new Map();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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

      onlineUsers.set(normalizedUserId, socket.id); // user ko map me add kra
      socketToUser.set(socket.id, normalizedUserId);
    });

    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId); // disconnect pe remove
        socketToUser.delete(socket.id);
      }
      console.log("User Disconnected"); 
    });
  });
}

// io return karega
function getIO() {
  return io;
}

module.exports = initSocket;
module.exports.getIO = getIO; 
module.exports.onlineUsers = onlineUsers; 
