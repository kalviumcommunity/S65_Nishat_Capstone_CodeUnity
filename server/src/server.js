const express = require("express");
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(PORT, ()=>{
    try{
        connectDB();
        console.log(`Server is running on port ${PORT}`);
    }catch(err){
        console.error("Error connecting to the database", err);
        process.exit(1);
    }
})