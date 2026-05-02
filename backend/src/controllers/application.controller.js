const Application = require("../models/Application");
const Job = require("../models/Job");
const Student = require("../models/Student");
const Placement = require("../models/Placement");
const Interview = require("../models/Interview");
const { normalizePlacementYear } = require("../utils/placementYear");
const { buildStudentSnapshot } = require("../utils/studentSnapshot");

function excelCsv(csvBody) {
  // Excel-friendly CSV: UTF-8 BOM + "sep=," directive + CRLF line endings
  const bom = "\ufeff";
  const sep = "sep=,\r\n";
  const body = String(csvBody).replace(/\r?\n/g, "\r\n");
  return bom + sep + body;
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function excelText(v) {
  const s = String(v ?? "");
  if (!s) return "";
  return `="${s.replace(/"/g, '""')}"`;
}

function getStudentDetails(application) {
  return application?.student || application?.studentSnapshot || {};
}

async function ensureJobOwnership(job, currentTpoId) {
  if (!job) return false;
  if (!job.createdByTpo || String(job.createdByTpo) === String(currentTpoId)) {
    return true;
  }

  job.createdByTpo = currentTpoId;
  await job.save();
  return true;
}

async function applyToJob(req, res) {
  const { jobId } = req.params;

  const student = await Student.findById(req.user.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (!student.isApproved) {
    return res.status(403).json({ message: "Not approved for placements yet. Contact TPO." });
  }

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (new Date(job.deadline).getTime() < Date.now()) {
    return res.status(400).json({ message: "Deadline passed" });
  }

  try {
    const application = await Application.create({
      job: jobId,
      student: req.user.id,
      studentSnapshot: buildStudentSnapshot(student)
    });
    return res.status(201).json(application);
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ message: "Already applied" });
    }
    throw e;
  }
}

async function myApplications(req, res) {
  const apps = await Application.find({ student: req.user.id })
    .populate("job")
    .sort({ createdAt: -1 });
  res.json(apps);
}

async function applicationsForJob(req, res) {
  const { jobId } = req.params;
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await ensureJobOwnership(job, req.user.id);

  const apps = await Application.find({ job: jobId })
    .populate("student", "-password")
    .populate("job")
    .sort({ createdAt: -1 });
  const filtered = placementYear
    ? apps.filter((app) => normalizePlacementYear(getStudentDetails(app).placementYear) === placementYear)
    : apps;
  res.json(filtered);
}

async function updateApplicationStatus(req, res) {
  const { applicationId } = req.params;
  const { status, note } = req.body;

  const allowed = ["APPLIED", "SHORTLISTED", "REJECTED", "SELECTED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const app = await Application.findById(applicationId).populate("job");
  if (!app) return res.status(404).json({ message: "Application not found" });
  await ensureJobOwnership(app.job, req.user.id);

  app.status = status;
  app.note = note || "";
  await app.save();

  if (status === "SELECTED") {
    const selectedStudent = await Student.findById(app.student);
    await Placement.findOneAndUpdate(
      { student: app.student, job: app.job._id },
      {
        $set: {
          student: app.student,
          studentSnapshot: buildStudentSnapshot(selectedStudent),
          job: app.job._id,
          company: app.job.company,
          package: app.job.salary || ""
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } else {
    await Placement.deleteMany({ student: app.student, job: app.job._id });
  }

  if (status === "APPLIED" || status === "REJECTED") {
    await Interview.deleteMany({ application: app._id });
  }

  res.json(app);
}

async function downloadApplicantsReport(req, res) {
  const { jobId } = req.params;
  const placementYear = normalizePlacementYear(req.query.placementYear);

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await ensureJobOwnership(job, req.user.id);

  const apps = await Application.find({ job: jobId })
    .populate("student", "-password")
    .populate("job");
  const filteredApps = placementYear
    ? apps.filter((app) => normalizePlacementYear(getStudentDetails(app).placementYear) === placementYear)
    : apps;

  const headers = [
    "JobTitle","Company","StudentName","StudentEmail","RollNo","Department","Year","Session","Phone","ApprovedForPlacement","ApplicationStatus","AppliedAt"
  ];

  const rows = filteredApps.map(a => {
    const student = getStudentDetails(a);
    return ([
    a.job?.title,
    a.job?.company,
    student?.name,
    student?.email,
    excelText(student?.rollNo),
    student?.department,
    student?.year,
    normalizePlacementYear(student?.placementYear),
    excelText(student?.phone),
    student?.isApproved ? "YES" : "NO",
    a.status,
    a.createdAt ? new Date(a.createdAt).toISOString() : ""
  ]);
  });

  const csv = [
    headers.join(","),
    ...rows.map(r => r.map(csvEscape).join(","))
  ].join("\n");

  const safeTitle = String(job.title || "job").replace(/[^a-z0-9\-_]+/gi, "_").slice(0, 60);
  const suffix = placementYear || "all";
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}_applicants_${suffix}.csv"`);
  return res.status(200).send(excelCsv(csv));
}

module.exports = { applyToJob, myApplications, applicationsForJob, updateApplicationStatus, downloadApplicantsReport };
