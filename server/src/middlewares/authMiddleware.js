require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authenticate = async (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        console.error('token is missing');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); 
        if(!decoded){
            console.log("Decoded token is null");
        }
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        req.user = user; 
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authenticate;
