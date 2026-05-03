// Manages placement records, selected student entries, and placement reports.
const Placement = require("../models/Placement");
const Application = require("../models/Application");
const Drive = require("../models/Drive");
const DriveRegistration = require("../models/DriveRegistration");
const Job = require("../models/Job");
const { normalizePlacementYear } = require("../utils/placementYear");
const { verifyToken } = require("../utils/jwt");
const Student = require("../models/Student");
const { buildStudentSnapshot } = require("../utils/studentSnapshot");

// Add Excel-friendly formatting so placement reports open correctly.
function excelCsv(csvBody) {
  const bom = "\ufeff";
  const sep = "sep=,\r\n";
  const body = String(csvBody).replace(/\r?\n/g, "\r\n");
  return bom + sep + body;
}

// Escape commas, quotes, and line breaks before writing CSV values.
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Force Excel to keep text fields like phone and roll number unchanged.
function excelText(v) {
  const s = String(v ?? "");
  if (!s) return "";
  return `="${s.replace(/"/g, '""')}"`;
}

// Read student data from the live relation or the saved snapshot.
function getStudentDetails(placement) {
  return placement?.student || placement?.studentSnapshot || {};
}

// Read the user from the JWT token when the placement list is role-aware.
function getOptionalUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Return placement records and filter them by session or TPO ownership.
async function listPlacements(req, res) {
  const items = await Placement.find()
    .populate("student", "-password")
    .populate("job")
    .populate("drive")
    .sort({ createdAt: -1 });

  const currentUser = getOptionalUser(req);
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const filtered = items.filter((x) => {
    const matchesYear = !placementYear || normalizePlacementYear(getStudentDetails(x).placementYear) === placementYear;
    const matchesOwner = !currentUser || currentUser.role !== "tpo" || String(x.job?.createdByTpo || x.drive?.createdByTpo) === String(currentUser.id);
    return matchesYear && matchesOwner;
  });

  res.json(filtered);
}

// Convert a selected application into a final placement record.
async function markSelectedToPlacement(req, res) {
  const { applicationId } = req.params;
  const { package: pkg, joiningDate, offerLetterLink } = req.body;

  const app = await Application.findById(applicationId).populate("job");
  if (!app) return res.status(404).json({ message: "Application not found" });

  if (String(app.job.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  app.status = "SELECTED";
  await app.save();
  const student = await Student.findById(app.student);

  const placement = await Placement.findOneAndUpdate(
    { student: app.student, job: app.job._id },
    {
      $set: {
        student: app.student,
        studentSnapshot: buildStudentSnapshot(student),
        job: app.job._id,
        company: app.job.company,
        package: pkg || app.job.salary || "",
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        offerLetterLink: offerLetterLink || ""
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(placement);
}

// Delete a placement and restore the related application or registration status.
async function deletePlacement(req, res) {
  const { placementId } = req.params;
  const placement = await Placement.findById(placementId);
  if (!placement) return res.status(404).json({ message: "Placement not found" });
  let ownerId = null;

  if (placement.job) {
    const job = await Job.findById(placement.job).lean();
    ownerId = job?.createdByTpo;
  } else if (placement.drive) {
    const drive = await Drive.findById(placement.drive).lean();
    ownerId = drive?.createdByTpo;
  }

  if (ownerId && String(ownerId) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

  await Placement.findByIdAndDelete(placementId);
  if (placement.job) {
    await Application.updateMany(
      { job: placement.job, student: placement.student, status: "SELECTED" },
      { $set: { status: "APPLIED" } }
    );
  }
  if (placement.drive) {
    await DriveRegistration.updateMany(
      { drive: placement.drive, student: placement.student, status: "SELECTED" },
      { $set: { status: "REGISTERED" } }
    );
  }

  res.json({ message: "Placement deleted" });
}

// Export placement records as a CSV report.
async function downloadPlacementsReport(req, res) {
  const items = await Placement.find()
    .populate("student", "-password")
    .populate("job")
    .populate("drive")
    .sort({ createdAt: -1 });

  const placementYear = normalizePlacementYear(req.query.placementYear);
  const filtered = placementYear
    ? items.filter((x) => normalizePlacementYear(getStudentDetails(x).placementYear) === placementYear)
    : items;

  const headers = ["StudentName","Email","RollNo","Dept","Year","Session","Company","OpportunityTitle","Package","JoiningDate","OfferLetterLink","CreatedAt"];
  const rows = filtered.map(p => {
    const student = getStudentDetails(p);
    return ([
    student?.name, student?.email, excelText(student?.rollNo), student?.department, student?.year, normalizePlacementYear(student?.placementYear),
    p.company, p.job?.title || p.drive?.title, p.package,
    p.joiningDate ? new Date(p.joiningDate).toISOString() : "",
    p.offerLetterLink || "",
    p.createdAt ? new Date(p.createdAt).toISOString() : ""
  ]);
  });

  const csv = [headers.join(","), ...rows.map(r => r.map(csvEscape).join(","))].join("\n");

  const suffix = placementYear || "all";
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="placements_report_${suffix}.csv"`);
  return res.status(200).send(excelCsv(csv));
}

module.exports = { listPlacements, markSelectedToPlacement, deletePlacement, downloadPlacementsReport };
