const express = require('express');
const { getMessages, joinRoom, sendMessage, updateMessageStatus } = require('../controllers/chatControllers');

const router = express.Router();

router.get('/history/:roomId', getMessages);
router.post('/join', joinRoom);
router.post('/message', sendMessage);
router.put('/message/status', updateMessageStatus);

module.exports = router;
