const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
}, {timestamps: true});

const User = mongoose.model("User", userSchema);
module.exports = User;