const mongoose = require("mongoose"); 
const threadSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId, // user id
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String, // last msg
    },
    lastMessageTime: {
      type: Date, // last msg ka time
    },
  },
  { timestamps: true } 
);
module.exports = mongoose.model("Thread", threadSchema);
