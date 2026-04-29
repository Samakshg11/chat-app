const mongoose = require("mongoose");
const Chat = require("../models/chat");
const Thread = require("../models/thread");
const asyncHandler = require("../utils/asyncHandler");
const { getIO, onlineUsers } = require("../socket/socket");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getPagination = (page, limit) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));

  return { safePage, safeLimit };
};

const buildParticipantsKey = (sender, receiver) => [String(sender), String(receiver)].sort().join(":");

// send message
exports.sendMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, message } = req.body;
  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!sender || !receiver || !normalizedMessage) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (!isValidObjectId(sender) || !isValidObjectId(receiver)) {
    return res.status(400).json({ message: "Invalid sender or receiver id" });
  }

  if (sender === receiver) {
    return res.status(400).json({ message: "Sender and receiver must be different" });
  }

  const participantsKey = buildParticipantsKey(sender, receiver);

  // create/find thread with race-safe upsert
  const thread = await Thread.findOneAndUpdate(
    { participantsKey },
    {
      $setOnInsert: {
        participants: [sender, receiver],
        participantsKey,
      },
    },
    { upsert: true, new: true }
  );

  // chat save
  const chat = await Chat.create({
    sender,
    receiver,
    message: normalizedMessage,
    thread: thread._id,
  });

  // thread update
  thread.lastMessage = normalizedMessage;
  thread.lastMessageTime = new Date();
  await thread.save();

  // realtime emit
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

  if (!isValidObjectId(threadId)) {
    return res.status(400).json({ message: "Invalid thread id" });
  }

  const { safePage, safeLimit } = getPagination(page, limit);

  const messages = await Chat.find({ thread: threadId })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit);

  res.status(200).json({
    data: messages,
    pagination: {
      page: safePage,
      limit: safeLimit,
      count: messages.length,
    },
  });
});
