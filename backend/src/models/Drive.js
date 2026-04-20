const mongoose = require("mongoose");

const driveSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    venue: { type: String, default: "" },
    description: { type: String, default: "" },

    eligibleDepartments: { type: [String], default: [] },
    eligibleYears: { type: [String], default: [] },
    minCgpa: { type: Number, default: 0 },
    minPercentage: { type: Number, default: 0 },

    jobIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Job", default: [] },

    createdByTpo: { type: mongoose.Schema.Types.ObjectId, ref: "Tpo", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drive", driveSchema);
