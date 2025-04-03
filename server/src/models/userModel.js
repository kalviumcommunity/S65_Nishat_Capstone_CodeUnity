const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
    },
    password: {
        type: String,
        required: true,
        minLength: 8, 
    },
    profilePicture: {
        type: String,
        default: '',
        match: /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/, 
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;