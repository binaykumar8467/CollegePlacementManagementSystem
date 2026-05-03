// Creates and verifies JWT tokens used for application authentication.
const jwt = require("jsonwebtoken");

// Create a signed JWT token for authenticated users.
function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

// Decode and validate the JWT token received from the client.
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
