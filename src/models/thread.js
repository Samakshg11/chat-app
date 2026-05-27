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

threadSchema.path("participants").validate(function validateParticipants(participants) {
  if (!Array.isArray(participants) || participants.length !== 2) {
    return false;
  }

  const uniqueParticipants = new Set(participants.map((participant) => String(participant)));
  return uniqueParticipants.size === 2;
}, "Thread must contain exactly two distinct participants");

threadSchema.pre("validate", function deriveParticipantsKey(next) {
  if ((!this.participantsKey || this.participantsKey.length === 0) && Array.isArray(this.participants)) {
    this.participantsKey = this.participants.map((participant) => String(participant)).sort().join(":");
  }
  next();
});

threadSchema.index({ participants: 1, lastMessageTime: -1 });

module.exports = mongoose.model("Thread", threadSchema);
