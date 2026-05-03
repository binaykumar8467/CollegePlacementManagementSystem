// Defines the MongoDB schema for Training and Placement Officer accounts.
const mongoose = require("mongoose");

const tpoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // âš ï¸ INSECURE: Plain password storage (only for demo/college project as requested)
    password: { type: String, required: true },

    collegeName: { type: String, default: "" },
    phone: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tpo", tpoSchema);
