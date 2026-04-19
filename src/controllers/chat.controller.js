const Chat = require("../models/chat");
const Thread = require("../models/thread");
const asyncHandler = require("../utils/asyncHandler");
const { getIO, onlineUsers } = require("../socket/socket");

// send message
exports.sendMessage = asyncHandler(async (req, res) => {

  const { sender, receiver, message } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // thread find
  let thread = await Thread.findOne({
    participants: { $all: [sender, receiver] },
  });

  // agar thread nahi mila to create karo
  if (!thread) {
    thread = await Thread.create({
      participants: [sender, receiver],
    });
  }

  // chat save
  const chat = await Chat.create({
    sender,
    receiver,
    message,
    thread: thread._id,
  });

  // thread update
  thread.lastMessage = message;
  thread.lastMessageTime = new Date();
  await thread.save();

  // 🔥 realtime emit (correct Map usage)
  const receiverSocket = onlineUsers.get(receiver);

  if (receiverSocket) {
    getIO().to(receiverSocket).emit("newMessage", chat);
  }

  res.status(200).json(chat);
});

// get messages
exports.getMessages = asyncHandler(async (req, res) => {

  const { threadId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const messages = await Chat.find({ thread: threadId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(201).json(messages);
});
