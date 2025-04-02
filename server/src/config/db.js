const mongoose = require('mongoose');
require("dotenv").config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected");
    }catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}
module.exports = connectDB;