const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },
    driveRegistration: { type: mongoose.Schema.Types.ObjectId, ref: "DriveRegistration", default: null },
    round: { type: String, default: "Round 1" },
    dateTime: { type: Date, required: true },
    location: { type: String, default: "" },
    mode: { type: String, enum: ["ONLINE", "OFFLINE"], default: "OFFLINE" },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

interviewSchema.index({ application: 1 }, { unique: true, partialFilterExpression: { application: { $type: "objectId" } } });
interviewSchema.index({ driveRegistration: 1 }, { unique: true, partialFilterExpression: { driveRegistration: { $type: "objectId" } } });

module.exports = mongoose.model("Interview", interviewSchema);
