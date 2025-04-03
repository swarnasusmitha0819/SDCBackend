require("dotenv").config();
const sendEmail = require("./utils/emailService");

sendEmail(
  "ikrammohammad2004@gmail.com",
  "Test Email",
  "<h1>Hello Serenify!</h1>"
)
  .then(() => console.log("📨 Email sent successfully!"))
  .catch((err) => console.error("❌ Email error:", err));
