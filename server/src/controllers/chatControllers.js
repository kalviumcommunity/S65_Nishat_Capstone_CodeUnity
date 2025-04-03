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

module.exports = { getMessages };
