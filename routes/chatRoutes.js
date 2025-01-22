const express = require("express");
const { handleChat, handleStream } = require("../controllers/chatController");

const router = express.Router();

/** Define the /chat route for normal chat. */
router.post("/chat", handleChat);

/** Define the /stream route for streaming chat. */
router.post("/stream", handleStream);

module.exports = router;
