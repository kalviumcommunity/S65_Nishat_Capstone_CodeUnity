const express = require('express');
const { getUser, registerUser, loginUser, updateUser } = require('../controllers/userController');
const router = express.Router();

router.get('/:id', getUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/update/:id', updateUser);

module.exports = router;