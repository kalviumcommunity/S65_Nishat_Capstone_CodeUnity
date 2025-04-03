const express = require('express');
const { getMessages } = require('../controllers/chatControllers');

const router = express.Router();

router.get('/history/:chatId', getMessages);


module.exports = router;
