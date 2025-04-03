const Chat = require('../models/chatModel');

const getMessages = async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
        res.json({ success: true, roomId, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const joinRoom = async (req, res) => {
    const { roomId, username } = req.body;
    res.json({ success: true, message: `Joined room: ${roomId} as ${username}` });
};

const sendMessage = async (req, res) => {
    const { roomId, chatId, senderId, receiverId, message } = req.body;
    try {
        const newMessage = new Chat({
            roomId,
            chatId,
            senderId,
            receiverId,
            message
        });
        await newMessage.save();
        res.status(201).json({ success: true, message: 'Message sent', data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMessageStatus = async (req, res) => {
    const { chatId, statusField, statusValue } = req.body;
    try {
        const validFields = ['isRead', 'isDeleted', 'isDelivered', 'isTyping', 'isOnline'];
        if (!validFields.includes(statusField)) {
            return res.status(400).json({ success: false, message: 'Invalid status field' });
        }
        const message = await Chat.findOneAndUpdate(
            { chatId },
            { [statusField]: statusValue },
            { new: true }
        );
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, message: 'Message status updated', data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMessages, joinRoom, sendMessage, updateMessageStatus };
