const express = require('express');
const { getUser, registerUser, loginUser } = require('../controllers/userController');
const router = express.Router();

router.get('/:id', getUser);
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;