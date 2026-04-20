const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Drive = require("../models/Drive");
const DriveRegistration = require("../models/DriveRegistration");
const Job = require("../models/Job");

async function createInterview(req, res) {
  const { applicationId } = req.params;
  const { round, dateTime, location, mode, note } = req.body;
  if (!dateTime) return res.status(400).json({ message: "dateTime required" });

  const app = await Application.findById(applicationId).populate("job");
  if (!app) return res.status(404).json({ message: "Application not found" });

  if (String(app.job.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  const interview = await Interview.findOneAndUpdate(
    { application: applicationId },
    {
      $set: {
        application: applicationId,
        round: round || "Round 1",
        dateTime: new Date(dateTime),
        location: location || "",
        mode: mode === "ONLINE" ? "ONLINE" : "OFFLINE",
        note: note || ""
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(interview);
}

async function createDriveInterview(req, res) {
  const { registrationId } = req.params;
  const { round, dateTime, location, mode, note } = req.body;
  if (!dateTime) return res.status(400).json({ message: "dateTime required" });

  const reg = await DriveRegistration.findById(registrationId).populate("drive");
  if (!reg) return res.status(404).json({ message: "Registration not found" });
  if (String(reg.drive.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  const interview = await Interview.findOneAndUpdate(
    { driveRegistration: registrationId },
    {
      $set: {
        application: null,
        driveRegistration: registrationId,
        round: round || "Round 1",
        dateTime: new Date(dateTime),
        location: location || "",
        mode: mode === "ONLINE" ? "ONLINE" : "OFFLINE",
        note: note || ""
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(interview);
}

async function listMyInterviews(req, res) {
  const apps = await Application.find({ student: req.user.id }).select("_id");
  const ids = apps.map(a => a._id);
  const regs = await DriveRegistration.find({ student: req.user.id }).select("_id");
  const regIds = regs.map((r) => r._id);

  const items = await Interview.find({
    $or: [
      { application: { $in: ids } },
      { driveRegistration: { $in: regIds } }
    ]
  })
    .populate({ path: "application", populate: [{ path: "job" }] })
    .populate({ path: "driveRegistration", populate: [{ path: "drive" }] })
    .sort({ dateTime: 1 });

  res.json(items);
}

async function listJobInterviews(req, res) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (String(job.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  const apps = await Application.find({ job: jobId }).select("_id");
  const ids = apps.map(a => a._id);

  const items = await Interview.find({ application: { $in: ids } })
    .populate({ path: "application", populate: [{ path: "student", select: "-password" }, { path: "job" }] })
    .sort({ dateTime: 1 });

  res.json(items);
}

async function listDriveInterviews(req, res) {
  const { driveId } = req.params;
  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });
  if (String(drive.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  const regs = await DriveRegistration.find({ drive: driveId }).select("_id");
  const regIds = regs.map((r) => r._id);

  const items = await Interview.find({ driveRegistration: { $in: regIds } })
    .populate({ path: "driveRegistration", populate: [{ path: "student", select: "-password" }, { path: "drive" }] })
    .sort({ dateTime: 1 });

  res.json(items);
}

module.exports = { createInterview, createDriveInterview, listMyInterviews, listJobInterviews, listDriveInterviews };
