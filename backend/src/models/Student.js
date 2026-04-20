const mongoose = require("mongoose");
const { getCurrentPlacementYear } = require("../utils/placementYear");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    rollNo: { type: String },
    department: { type: String },
    year: { type: String },
    placementYear: { type: String, default: getCurrentPlacementYear },
    phone: { type: String },
    skills: { type: [String], default: undefined },
    resumeLink: { type: String },

    gradingSystem: { type: String, enum: ["", "cgpa", "percentage"] },
    cgpa: { type: Number },
    percentage: { type: Number },
    class10Percentage: { type: Number },
    class12Percentage: { type: Number },
    semesterPercentages: { type: [Number], default: undefined },

    resumeFile: { type: String },
    resumeFileName: { type: String },
    resumeMimeType: { type: String },
    resumeData: { type: Buffer, select: false },

    profilePhotoFile: { type: String },
    profilePhotoFileName: { type: String },
    profilePhotoMimeType: { type: String },
    profilePhotoData: { type: Buffer, select: false },

    passwordResetOtpHash: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },
    passwordResetVerifiedTokenHash: { type: String, select: false },
    passwordResetVerifiedTokenExpiresAt: { type: Date, select: false },

    isApproved: { type: Boolean, default: false },
    approvalNote: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
