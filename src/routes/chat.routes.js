const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

// lightweight health check
router.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

router.post("/send", chatController.sendMessage);
router.get("/threads/me", chatController.getThreads);
router.get("/threads/:userId", chatController.getThreads);
router.patch("/thread/:threadId/read/me", chatController.markThreadAsRead);
router.patch("/thread/:threadId/read", chatController.markThreadAsRead);

router.get("/:threadId", chatController.getMessages);

module.exports = router;
