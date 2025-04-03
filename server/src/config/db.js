require('dotenv').config()
const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected");
    }catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}
module.exports = connectDB;