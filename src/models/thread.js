const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      type: String,
    },
    lastMessageTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Thread", threadSchema);
