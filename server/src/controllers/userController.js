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
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!hashedPassword) {
        return res.status(500).json({ message: 'Error hashing password' });
      }
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
      });
  
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      if (!token) {
        return res.status(500).json({ message: 'Error generating token' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
  
  const loginUser = async(req,res) =>{
      const { name, email } = req.body;
      if (!name && !email) {
          return res.status(400).json({ message: 'Name or email is required' });
      }
      try {
          const user = await User.findOne({ $or: [{ name }, { email }] });
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
  
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(401).json({ message: 'Invalid credentials' });
          }
  
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '1h',
          });
          res.status(200).json({ token });
      }
      catch (error) {
          res.status(500).json({ message: 'Server error', error });
      }
  }


const userController = {
    getUser,
    registerUser,
    loginUser
};

module.exports = userController;