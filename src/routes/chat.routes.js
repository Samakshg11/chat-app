const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

router.post("/send", chatController.sendMessage);
router.get("/threads/:userId", chatController.getThreads);
router.patch("/thread/:threadId/read", chatController.markThreadAsRead);

router.get("/:threadId", chatController.getMessages);

module.exports = router;
