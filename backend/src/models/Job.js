// Defines the MongoDB schema for job postings created by TPO users.
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    salary: { type: String, default: "" },
    description: { type: String, default: "" },
    eligibilityCourses: { type: [String], default: [] },
    eligibility: { type: String, default: "" },
    deadline: { type: Date, required: true },
    createdByTpo: { type: mongoose.Schema.Types.ObjectId, ref: "Tpo", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
