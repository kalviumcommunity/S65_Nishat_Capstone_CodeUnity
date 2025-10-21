const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("[SUCCESS] MongoDB Connected!"))
    .catch((err) => console.error("[ERROR] MongoDB Connection Error:", err.message));

module.exports = mongoose;