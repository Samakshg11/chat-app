const { Server } = require("socket.io");

let io;
const onlineUsers = new Map(); 

function initSocket(server) {

  io = new Server(server, {
    cors: { origin: "*" } // cors allow kr diya
  });

  io.on("connection", (socket) => {
    console.log("User Connected"); // connect hua

    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id); // user ko map me add kra
    });

    socket.on("disconnect", () => {
      for (const [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key); // disconnect pe remove
        }
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
