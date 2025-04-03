const express = require('express');
const { getUser, registerUser, loginUser, updateUser, getAllUsers } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/:id', authMiddleware, getUser); 
router.post('/register', registerUser);
router.get('/getAll', authMiddleware, getAllUsers);
router.post('/login', loginUser);
router.put('/update/:id', authMiddleware, updateUser);

module.exports = router;