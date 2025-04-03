const express = require("express");
// const bcrypt = require("bcrypt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Make sure your DB config is correct
const sendEmail = require("../utils/emailService");

const router = express.Router();

router.post("/signup", async (req, res) => {
  console.log("🛠️ Debugging Request Body:", req.body);

  const { name, email, password, role, profile_pic } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO users (name, email, password_hash, role, profile_pic) VALUES (?, ?, ?, ?, ?)";

    db.query(
      query,
      [name, email, hashedPassword, role, profile_pic || null],
      (err, result) => {
        if (err) {
          console.error("❌ Database Error:", err);
          return res
            .status(500)
            .json({ error: "Database error!", details: err.sqlMessage });
        }
        res.json({ success: true, message: "User registered successfully!" });
      }
    );
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal server error!" });
  }
});
// Login Route
// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");  // 🔥 Fix: Import JWT
// const db = require("../config/db");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found!" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error!" });
  }
});

// Test Route
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth API is working!" });
});

const crypto = require("crypto"); // Generates random reset tokens

// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ error: "Email is required!" });

//   try {
//     const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (users.length === 0)
//       return res.status(404).json({ error: "User not found!" });

//     const user = users[0];

//     // Generate reset token (random string)
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

//     // Store token & expiry in DB (You need to add `reset_token` & `reset_token_expiry` columns in your DB)
//     await db.query(
//       "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
//       [resetToken, resetTokenExpiry, user.id]
//     );

//     // TODO: Send this token via email (for now, just return in response)
//     res.json({ message: "Reset link generated!", resetToken });
//   } catch (err) {
//     console.error("❌ Server Error:", err);
//     res.status(500).json({ error: "Server error!" });
//   }
// });

router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?",
      [resetToken, Date.now()]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token!" });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password & clear reset token
    await db.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error!" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required!" });
  }

  try {
    // Check if user exists
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found!" });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Store reset token in database
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [resetToken, resetTokenExpiry, user.id]
    );

    const resetLink = `http://localhost:5000/reset-password/${resetToken}`;
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour.</p>
    `;

    await sendEmail(user.email, "Password Reset Request", emailHtml);

    res.json({ success: true, message: "Password reset email sent!" });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Server error!" });
  }
});

// Route to get all users
router.get("/users", async (req, res) => {
  console.log("📢 /users route hit!"); // Debugging
  try {
    const [users] = await db.query("SELECT id, name, email, role FROM users");

    if (users.length === 0) {
      return res.status(404).json({ error: "No users found!" });
    }

    res.json({ success: true, users });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error!" });
  }
});

module.exports = router;
