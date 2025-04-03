require("dotenv").config();
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Connected to MySQL Database!");
    connection.release(); // ✅ Release the connection after checking
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
  }
})();

module.exports = db;
