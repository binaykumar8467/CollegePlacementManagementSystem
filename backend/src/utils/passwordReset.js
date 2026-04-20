const crypto = require("crypto");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function generateVerifiedResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { generateOtp, hashValue, generateVerifiedResetToken };
