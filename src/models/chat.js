const mongoose = require("mongoose"); 

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true, 
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId, // user  ki id
      ref: "User", // user se link krewga
      required: true, 
    },
    message: {
      type: String, 
      required: true, 
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId, // thread id
      ref: "Thread", // thread se link krega
    },
    isRead: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true } // auto time add
);

module.exports = mongoose.model("Chat", chatSchema);
