const mongoose = require("mongoose");
const Chat = require("../models/chat");
const Thread = require("../models/thread");
const asyncHandler = require("../utils/asyncHandler");
const { getIO, onlineUsers } = require("../socket/socket");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const toObjectIdString = (value) => String(value);
const normalizeMessage = (value) => (typeof value === "string" ? value.trim() : "");
const badRequest = (res, message) => res.status(400).json({ message });

const getPagination = (page, limit) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));

  return { safePage, safeLimit };
};
const buildPagination = ({ page, limit, count, total }) => ({
  page,
  limit,
  count,
  total,
  hasMore: (page - 1) * limit + count < total,
});

const buildParticipantsKey = (sender, receiver) => [String(sender), String(receiver)].sort().join(":");
const ensureThreadExists = async (threadId) => {
  const thread = await Thread.findById(threadId).select("_id").lean();
  return thread;
};

exports.getThreads = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const normalizedUserId = toObjectIdString(userId);

  if (!isValidObjectId(normalizedUserId)) {
    return badRequest(res, "Invalid user id");
  }

  const { safePage, safeLimit } = getPagination(page, limit);
  const skip = (safePage - 1) * safeLimit;

  const query = { participants: normalizedUserId };
  const [threads, total] = await Promise.all([
    Thread.find(query)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Thread.countDocuments(query),
  ]);

  res.status(200).json({
    data: threads,
    pagination: buildPagination({
      page: safePage,
      limit: safeLimit,
      count: threads.length,
      total,
    }),
  });
});

// send message
exports.sendMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, message } = req.body;
  const normalizedSender = toObjectIdString(sender);
  const normalizedReceiver = toObjectIdString(receiver);
  const normalizedMessage = normalizeMessage(message);

  if (!sender || !receiver || !normalizedMessage) {
    return badRequest(res, "Missing fields");
  }

  if (!isValidObjectId(normalizedSender) || !isValidObjectId(normalizedReceiver)) {
    return badRequest(res, "Invalid sender or receiver id");
  }

  if (normalizedSender === normalizedReceiver) {
    return badRequest(res, "Sender and receiver must be different");
  }

  const participantsKey = buildParticipantsKey(normalizedSender, normalizedReceiver);

  // create/find thread with race-safe upsert
  const thread = await Thread.findOneAndUpdate(
    { participantsKey },
    {
      $setOnInsert: {
        participants: [normalizedSender, normalizedReceiver],
        participantsKey,
      },
    },
    { upsert: true, new: true }
  );

  // chat save
  const chat = await Chat.create({
    sender: normalizedSender,
    receiver: normalizedReceiver,
    message: normalizedMessage,
    thread: thread._id,
  });

  // thread update
  await Thread.updateOne(
    { _id: thread._id },
    {
      $set: {
        lastMessage: normalizedMessage,
        lastMessageTime: new Date(),
      },
    }
  );

  // realtime emit
  const receiverSocket = onlineUsers.get(normalizedReceiver);

  if (receiverSocket) {
    getIO().to(receiverSocket).emit("newMessage", chat);
  }

  res.status(201).json(chat);
});

// get messages
exports.getMessages = asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { page = 1, limit = 20, order = "desc" } = req.query;

  if (!isValidObjectId(threadId)) {
    return res.status(400).json({ message: "Invalid thread id" });
  }

  const thread = await ensureThreadExists(threadId);
  if (!thread) {
    return res.status(404).json({ message: "Thread not found" });
  }

  const { safePage, safeLimit } = getPagination(page, limit);
  const skip = (safePage - 1) * safeLimit;
  const normalizedOrder = typeof order === "string" ? order.toLowerCase() : "desc";

  if (normalizedOrder !== "asc" && normalizedOrder !== "desc") {
    return badRequest(res, "Invalid order. Use 'asc' or 'desc'");
  }
  const sortDirection = normalizedOrder === "asc" ? 1 : -1;

  const [messages, total] = await Promise.all([
    Chat.find({ thread: threadId})
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Chat.countDocuments({ thread: threadId }),
  ]);

  res.status(200).json({
    data: messages,
    pagination: buildPagination({
      page: safePage,
      limit: safeLimit,
      count: messages.length,
      total,
    }),
  });
});

exports.markThreadAsRead = asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { userId } = req.body;
  const normalizedUserId = toObjectIdString(userId);

  if (!isValidObjectId(threadId) || !isValidObjectId(normalizedUserId)) {
    return badRequest(res, "Invalid thread id or user id");
  }
  const thread = await ensureThreadExists(threadId);
  if (!thread) {
    return res.status(404).json({ message: "Thread not found" });
  }
  const unreadFilter = {
    thread: threadId,
    receiver: normalizedUserId,
    isRead: false,
  };
  const senderIds = await Chat.distinct("sender", unreadFilter);

  const result = await Chat.updateMany(
    unreadFilter,
    {
      $set: { isRead: true },
    }
  );
  if ((result.modifiedCount || 0) > 0) {
    senderIds.forEach((senderId) => {
      const senderSocket = onlineUsers.get(String(senderId));
      if (senderSocket) {
        getIO().to(senderSocket).emit("threadRead", {
          threadId,
          readBy: normalizedUserId,
        });
      }
    });
  }

  res.status(200).json({
    message: "Thread marked as read",
    updatedCount: result.modifiedCount || 0,
  });
});
