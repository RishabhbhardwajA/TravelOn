const express = require("express");
const router = express.Router();
const botController = require("../controller/bot.js");

// Chat Endpoint
router.post("/chat", botController.chatBot);

module.exports = router;
