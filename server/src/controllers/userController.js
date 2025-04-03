require('dotenv').config();
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
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

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
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const loginUser = async(req,res) =>{
    const { name, email, password } = req.body;
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

        res.status(200).json({'message': "LOGIN SUCCESSFUL"});
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

const updateUser = async (req, res) => {
    const { id } = req.params; 
    const { name, email, profilePicture } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email, profilePicture },
            { new: true }
        );
        if (!updatedUser) {
            console.error('User not found with ID:', id);
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).json({ message: 'Server error', error });
    }
};

const getAllUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }

const userController = {
    getUser,
    registerUser,
    loginUser,
    updateUser,
    getAllUsers
};

module.exports = userController;