const mongoose = require("mongoose");

const studentSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    rollNo: { type: String, default: "" },
    department: { type: String, default: "" },
    year: { type: String, default: "" },
    placementYear: { type: String, default: "" },
    phone: { type: String, default: "" },
    gradingSystem: { type: String, default: "" },
    cgpa: { type: Number, default: null },
    percentage: { type: Number, default: null },
    class10Percentage: { type: Number, default: null },
    class12Percentage: { type: Number, default: null },
    skills: { type: [String], default: [] },
    resumeLink: { type: String, default: "" },
    isApproved: { type: Boolean, default: false }
  },
  { _id: false }
);

const driveRegistrationSchema = new mongoose.Schema(
  {
    drive: { type: mongoose.Schema.Types.ObjectId, ref: "Drive", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    studentSnapshot: { type: studentSnapshotSchema, default: () => ({}) },
    status: { type: String, enum: ["REGISTERED", "SHORTLISTED", "REJECTED", "SELECTED"], default: "REGISTERED" },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

driveRegistrationSchema.index({ drive: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("DriveRegistration", driveRegistrationSchema);
