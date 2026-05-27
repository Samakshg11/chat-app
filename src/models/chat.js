const mongoose = require("mongoose");
const { MAX_MESSAGE_LENGTH } = require("../config/chat.constants");

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_MESSAGE_LENGTH,
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

chatSchema.index({ thread: 1, createdAt: -1 });
chatSchema.index({ thread: 1, receiver: 1, isRead: 1 });
chatSchema.index({ receiver: 1, thread: 1, isRead: 1, createdAt: -1 });
chatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
