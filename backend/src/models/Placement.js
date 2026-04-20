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

const placementSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    studentSnapshot: { type: studentSnapshotSchema, default: () => ({}) },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    drive: { type: mongoose.Schema.Types.ObjectId, ref: "Drive", default: null },
    company: { type: String, required: true },
    package: { type: String, default: "" },
    joiningDate: { type: Date, default: null },
    offerLetterLink: { type: String, default: "" }
  },
  { timestamps: true }
);

placementSchema.index({ student: 1, job: 1 }, { unique: true, partialFilterExpression: { job: { $type: "objectId" } } });
placementSchema.index({ student: 1, drive: 1 }, { unique: true, partialFilterExpression: { drive: { $type: "objectId" } } });

module.exports = mongoose.model("Placement", placementSchema);
