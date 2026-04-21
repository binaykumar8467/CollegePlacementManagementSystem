const mongoose = require("mongoose");

const pendingSignupSchema = new mongoose.Schema(
  {
    signupToken: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["student", "tpo"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true, index: true },

    placementYear: { type: String },
    collegeName: { type: String },
    previousPassword: { type: String },

    emailOtpHash: { type: String, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    phoneOtpHash: { type: String, select: false },
    phoneOtpExpiresAt: { type: Date, select: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
