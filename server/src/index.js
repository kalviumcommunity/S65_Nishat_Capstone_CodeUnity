require('dotenv').config()
const express = require('express'); 
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());    
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT']
    }
});
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('joinRoom', ({ roomId, token }) => {
        try {
            const decoded = jwt.verify(token, 'secretKey');
            socket.join(roomId);
            io.to(roomId).emit('userJoined', `User ${decoded.userId} joined`);
            console.log(`User ${decoded.userId} joined room ${roomId}`);
        } catch {
            socket.emit('error', 'Authentication failed');
        }
    });

    socket.on('sendMessage', ({ roomId, message }) => {
        io.to(roomId).emit('newMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
app.listen(PORT, () => {
    try{
        connectDB();
        console.log(`Server is running on port ${PORT}`);
    }catch(err){
        console.error(err);
        process.exit(1);
    }}
);
