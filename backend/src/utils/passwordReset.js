// Generates and hashes OTP and reset tokens for password recovery flows.
const crypto = require("crypto");

// Generate a short numeric OTP for verification flows.
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Hash tokens or OTP values before saving them in the database.
function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

// Generate a secure token for the verified password-reset session.
function generateVerifiedResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { generateOtp, hashValue, generateVerifiedResetToken };
