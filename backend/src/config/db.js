// Handles MongoDB connection setup for the backend application.
const mongoose = require("mongoose");

// Connect to MongoDB before the API server starts handling requests.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("âœ… MongoDB connected");
}

module.exports = connectDB;
