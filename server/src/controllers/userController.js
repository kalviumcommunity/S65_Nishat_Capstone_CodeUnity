const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const getUser = async (req, res) => {
  const { name, email } = req.body;
    if (!name && !email) {
        return res.status(400).json({ message: 'Name or email is required' });
    }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}
const userController = {
    getUser,
};

module.exports = userController;