const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json()); // ✅ Make sure this is present!
app.use(express.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database!");
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("Serenify Backend is Running! 🚀");
});

// Load Auth Routes (🔥 THIS MUST BE HERE)
const authRoutes = require("./routes/auth"); // ✅ Ensure the path is correct
app.use("/api/auth", authRoutes); // ✅ This ensures `/api/auth/signup` works

console.log("Database URL:", process.env.DB_HOST);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
