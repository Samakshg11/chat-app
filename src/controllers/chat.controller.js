const Chat = require("../models/chat");
const Thread = require("../models/thread");
const asyncHandler = require("../utils/asyncHandler");
const { emitToUser } = require("../socket/socket");
const { MAX_MESSAGE_LENGTH } = require("../config/chat.constants");
const { badRequest, forbidden, notFound } = require("../utils/httpResponses");
const {
  getPagination,
  isValidObjectId,
  parseBoolean,
  parseSortOrder,
  toObjectId,
  toObjectIdString,
} = require("../utils/requestParsers");

const NOT_PARTICIPANT_ERROR = "You are not a participant in this thread";

const normalizeMessage = (value) =>
  (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const buildPagination = ({ page, limit, count, total }) => ({
  page,
  limit,
  count,
  total,
  totalPages: Math.ceil(total / limit),
  hasMore: (page - 1) * limit + count < total,
});

const buildParticipantsKey = (sender, receiver) => [String(sender), String(receiver)].sort().join(":");
const resolveActorId = (req, fallbackUserId) => req.auth?.userId || fallbackUserId || null;
const ensureThreadWithParticipants = async (threadId) => {
  const thread = await Thread.findById(threadId).select("_id participants").lean();
  return thread;
};
const isParticipant = (thread, userId) =>
  Array.isArray(thread?.participants) && thread.participants.some((participantId) => String(participantId) === userId);

exports.getThreads = asyncHandler(async (req, res) => {
  const requestedUserId = req.params.userId;
  const userId = resolveActorId(req, requestedUserId);
  if (!userId) {
    return badRequest(res, "Missing user id");
  }
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
      .sort({ lastMessageTime: -1, updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Thread.countDocuments(query),
  ]);
  const threadIds = threads.map((thread) => thread._id);
  if (threadIds.length === 0) {
    return res.status(200).json({
      data: [],
      pagination: buildPagination({
        page: safePage,
        limit: safeLimit,
        count: 0,
        total,
      }),
    });
  }
  const unreadCounts = await Chat.aggregate([
    {
      $match: {
        thread: { $in: threadIds },
        receiver: toObjectId(normalizedUserId),
        isRead: false,
      },
    },
    {
      $group: {
        _id: "$thread",
        count: { $sum: 1 },
      },
    },
  ]);
  const unreadByThread = new Map(unreadCounts.map((row) => [String(row._id), row.count]));
  const threadsWithUnread = threads.map((thread) => ({
    ...thread,
    unreadCount: unreadByThread.get(String(thread._id)) || 0,
    otherParticipantId:
      thread.participants?.find((participantId) => String(participantId) !== normalizedUserId) || null,
  }));

  res.status(200).json({
    data: threadsWithUnread,
    pagination: buildPagination({
      page: safePage,
      limit: safeLimit,
      count: threadsWithUnread.length,
      total,
    }),
  });
});

// send message
exports.sendMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, message } = req.body;
  const actorUserId = resolveActorId(req, null);
  const rawSender = actorUserId || sender;
  const normalizedSender = rawSender ? toObjectIdString(rawSender) : null;
  const normalizedReceiver = receiver ? toObjectIdString(receiver) : null;
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedSender || !normalizedReceiver || !normalizedMessage) {
    return badRequest(res, "Missing fields");
  }
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    return badRequest(res, `Message exceeds ${MAX_MESSAGE_LENGTH} characters`);
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
        lastMessageTime: chat.createdAt,
      },
    }
  );

  // realtime emit
  emitToUser(normalizedReceiver, "newMessage", chat);

  res.status(201).json(chat);
});

// get messages
exports.getMessages = asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { page = 1, limit = 20, order = "desc", userId: queryUserId, markAsRead = "false" } = req.query;
  const actorUserId = resolveActorId(req, queryUserId);
  const normalizedUserId = actorUserId ? toObjectIdString(actorUserId) : null;
  const shouldMarkAsRead = parseBoolean(markAsRead);

  if (!isValidObjectId(threadId) || (normalizedUserId && !isValidObjectId(normalizedUserId))) {
    return badRequest(res, "Invalid thread id or user id");
  }

  const thread = await ensureThreadWithParticipants(threadId);
  if (!thread) {
    return notFound(res, "Thread not found");
  }
  if (normalizedUserId && !isParticipant(thread, normalizedUserId)) {
    return forbidden(res, NOT_PARTICIPANT_ERROR);
  }

  const { safePage, safeLimit } = getPagination(page, limit);
  const skip = (safePage - 1) * safeLimit;
  const normalizedOrder = parseSortOrder(order);

  if (!normalizedOrder) {
    return badRequest(res, "Invalid order. Use 'asc' or 'desc'");
  }
  const sortDirection = normalizedOrder === "asc" ? 1 : -1;

  const [messages, total] = await Promise.all([
    Chat.find({ thread: threadId})
      .sort({ createdAt: sortDirection, _id: sortDirection })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Chat.countDocuments({ thread: threadId }),
  ]);
  if (shouldMarkAsRead && normalizedUserId) {
    await Chat.updateMany(
      {
        thread: threadId,
        receiver: normalizedUserId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );
  }

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
  const { userId: bodyUserId } = req.body;
  const userId = resolveActorId(req, bodyUserId);
  if (!userId) {
    return badRequest(res, "Missing user id");
  }
  const normalizedUserId = toObjectIdString(userId);

  if (!isValidObjectId(threadId) || !isValidObjectId(normalizedUserId)) {
    return badRequest(res, "Invalid thread id or user id");
  }
  const thread = await ensureThreadWithParticipants(threadId);
  if (!thread) {
    return notFound(res, "Thread not found");
  }
  if (!isParticipant(thread, normalizedUserId)) {
    return forbidden(res, NOT_PARTICIPANT_ERROR);
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
      emitToUser(String(senderId), "threadRead", {
        threadId,
        readBy: normalizedUserId,
      });
    });
  }

  res.status(200).json({
    message: "Thread marked as read",
    updatedCount: result.modifiedCount || 0,
  });
});
