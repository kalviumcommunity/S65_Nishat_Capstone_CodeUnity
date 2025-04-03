const express = require('express');
const { getMessages, joinRoom, sendMessage } = require('../controllers/chatControllers');

const router = express.Router();

router.get('/history/:chatId', getMessages);
router.post('/join', joinRoom);
router.post('/message', sendMessage);

module.exports = router;
