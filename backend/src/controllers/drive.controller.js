// Manages campus drives, registrations, eligibility checks, and drive reports.
const Drive = require("../models/Drive");
const DriveRegistration = require("../models/DriveRegistration");
const Placement = require("../models/Placement");
const Student = require("../models/Student");
const { normalizePlacementYear } = require("../utils/placementYear");
const { buildStudentSnapshot } = require("../utils/studentSnapshot");
const { isStudentProfileComplete, matchesEligibleCourse } = require("../utils/studentEligibility");

// Add Excel-friendly formatting so drive reports open correctly.
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

// Read student data from the live relation or the saved snapshot.
function getStudentDetails(registration) {
  return registration?.student || registration?.studentSnapshot || {};
}

// Make sure only the owning TPO can manage this drive and its registrations.
async function ensureDriveOwnership(drive, currentTpoId) {
  if (!drive) return false;
  if (!drive.createdByTpo || String(drive.createdByTpo) === String(currentTpoId)) {
    return true;
  }

  // Allow the active TPO to adopt legacy drive records that may still
  // point to an older TPO document after account changes.
  drive.createdByTpo = currentTpoId;
  await drive.save();
  return true;
}

// Return the available campus drives in date order.
async function listDrives(req, res) {
  const drives = await Drive.find().sort({ dateTime: 1 }).lean();
  res.json(drives);
}

// Normalize the drive form data before it is stored in MongoDB.
function normalizeDrivePayload(body) {
  const { title, company, dateTime, venue, description, eligibleDepartments, minCgpa, minPercentage, jobIds } = body;
  const normalizedDepartments = Array.isArray(eligibleDepartments)
    ? eligibleDepartments.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return {
    title,
    company,
    dateTime: new Date(dateTime),
    venue: venue || "",
    description: description || "",
    eligibleDepartments: [...new Set(normalizedDepartments)],
    eligibleYears: [],
    minCgpa: Number(minCgpa || 0),
    minPercentage: Number(minPercentage || 0),
    jobIds: Array.isArray(jobIds) ? jobIds : [],
  };
}

// Create a new campus drive for the logged-in TPO.
async function createDrive(req, res) {
  const { title, company, dateTime } = req.body;
  if (!title || !company || !dateTime) return res.status(400).json({ message: "title, company, dateTime required" });

  const drive = await Drive.create({
    ...normalizeDrivePayload(req.body),
    createdByTpo: req.user.id
  });

  res.status(201).json(drive);
}

// Update the selected campus drive after validating ownership.
async function updateDrive(req, res) {
  const { driveId } = req.params;
  const { title, company, dateTime } = req.body;
  if (!title || !company || !dateTime) return res.status(400).json({ message: "title, company, dateTime required" });

  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });
  await ensureDriveOwnership(drive, req.user.id);

  Object.assign(drive, normalizeDrivePayload(req.body));
  await drive.save();
  res.json(drive);
}

// Delete a drive and remove its related registrations.
async function deleteDrive(req, res) {
  const { driveId } = req.params;
  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });
  await ensureDriveOwnership(drive, req.user.id);

  await DriveRegistration.deleteMany({ drive: driveId });
  await Drive.findByIdAndDelete(driveId);
  res.json({ message: "Drive deleted successfully" });
}

// Check student eligibility rules and create a drive registration.
async function registerForDrive(req, res) {
  const { driveId } = req.params;
  const student = await Student.findById(req.user.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (!student.isApproved) return res.status(403).json({ message: "Not approved for placements yet. Contact TPO." });
  if (!isStudentProfileComplete(student)) {
    return res.status(403).json({ message: "Complete your profile with roll number, course, year, phone, and marks before registering for drives." });
  }

  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });

  if (!matchesEligibleCourse(student.department, drive.eligibleDepartments || [])) {
    return res.status(403).json({ message: "You are not eligible. Course does not match." });
  }

  if (student.gradingSystem === "cgpa") {
    const studentCgpa = Number(student.cgpa);
    if (!Number.isFinite(studentCgpa)) return res.status(403).json({ message: "Complete your CGPA in profile before registering" });
    if (studentCgpa < Number(drive.minCgpa || 0)) return res.status(403).json({ message: "You are not eligible. CGPA is less than required minimum." });
  } else if (student.gradingSystem === "percentage") {
    const studentPercentage = Number(student.percentage);
    if (!Number.isFinite(studentPercentage)) return res.status(403).json({ message: "Complete your semester percentages in profile before registering" });
    if (studentPercentage < Number(drive.minPercentage || 0)) return res.status(403).json({ message: "You are not eligible. Percentage is less than required minimum." });
  } else {
    return res.status(403).json({ message: "Select CGPA or Percentage in your profile before registering" });
  }

  try {
    const reg = await DriveRegistration.create({
      drive: driveId,
      student: req.user.id,
      studentSnapshot: buildStudentSnapshot(student)
    });
    return res.status(201).json(reg);
  } catch (e) {
    if (String(e.message).includes("duplicate key")) return res.status(409).json({ message: "Already registered" });
    throw e;
  }
}

// Return the drives registered by the logged-in student.
async function myDriveRegistrations(req, res) {
  const regs = await DriveRegistration.find({ student: req.user.id }).populate("drive").sort({ createdAt: -1 });
  res.json(regs);
}

// List student registrations for a drive, with optional session filtering.
async function driveRegistrations(req, res) {
  const { driveId } = req.params;
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });
  await ensureDriveOwnership(drive, req.user.id);

  const regs = await DriveRegistration.find({ drive: driveId })
    .populate("student", "-password -resumeData -profilePhotoData")
    .populate("drive");
  const filtered = placementYear
    ? regs.filter((reg) => normalizePlacementYear(getStudentDetails(reg).placementYear) === placementYear)
    : regs;
  res.json(filtered);
}

// Update a drive registration status and keep placement records in sync.
async function updateRegistrationStatus(req, res) {
  const { regId } = req.params;
  const { status, note } = req.body;
  const allowed = ["REGISTERED", "SHORTLISTED", "REJECTED", "SELECTED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const reg = await DriveRegistration.findById(regId).populate("drive");
  if (!reg) return res.status(404).json({ message: "Registration not found" });
  await ensureDriveOwnership(reg.drive, req.user.id);

  reg.status = status;
  reg.note = note || "";
  await reg.save();

  if (status === "SELECTED") {
    const selectedStudent = await Student.findById(reg.student);
    await Placement.findOneAndUpdate(
      { student: reg.student, drive: reg.drive._id },
      {
        $set: {
          student: reg.student,
          studentSnapshot: buildStudentSnapshot(selectedStudent),
          drive: reg.drive._id,
          company: reg.drive.company,
          package: "",
          joiningDate: null,
          offerLetterLink: ""
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } else {
    await Placement.deleteOne({ student: reg.student, drive: reg.drive._id });
  }

  res.json(reg);
}

// Export the registration list for one drive as a CSV report.
async function downloadDriveReport(req, res) {
  const { driveId } = req.params;
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const drive = await Drive.findById(driveId);
  if (!drive) return res.status(404).json({ message: "Drive not found" });
  await ensureDriveOwnership(drive, req.user.id);

  const regs = await DriveRegistration.find({ drive: driveId })
    .populate("student", "-password -resumeData -profilePhotoData")
    .populate("drive");
  const filteredRegs = placementYear
    ? regs.filter((reg) => normalizePlacementYear(getStudentDetails(reg).placementYear) === placementYear)
    : regs;

  const headers = ["DriveTitle","Company","DriveDateTime","StudentName","Email","RollNo","Dept","Year","Session","Approved","Status","RegisteredAt"];
  const rows = filteredRegs.map(x => {
    const student = getStudentDetails(x);
    return ([
    x.drive?.title, x.drive?.company, x.drive?.dateTime ? new Date(x.drive.dateTime).toISOString() : "",
    student?.name, student?.email, student?.rollNo, student?.department, student?.year, normalizePlacementYear(student?.placementYear),
    student?.isApproved ? "YES" : "NO", x.status, x.createdAt ? new Date(x.createdAt).toISOString() : ""
  ]);
  });

  const csv = [headers.join(","), ...rows.map(r => r.map(csvEscape).join(","))].join("\n");
  const safeTitle = String(drive.title || "drive").replace(/[^a-z0-9\-_]+/gi, "_").slice(0, 60);
  const suffix = placementYear || "all";
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}_registrations_${suffix}.csv"`);
  return res.status(200).send(excelCsv(csv));
}

// Export the overall drive summary for the logged-in TPO.
async function downloadDrivesSummaryReport(req, res) {
  const drives = await Drive.find({ createdByTpo: req.user.id }).sort({ createdAt: -1 }).lean();
  const regCounts = await DriveRegistration.aggregate([{ $group: { _id: "$drive", total: { $sum: 1 } } }]);
  const countMap = new Map(regCounts.map((x) => [String(x._id), x.total]));
  const headers = ["Title","Company","DateTime","Venue","EligibleDepartments","MinCGPA","MinPercentage","Registrations","CreatedAt"];
  const rows = drives.map((d) => ([
    d.title, d.company, d.dateTime ? new Date(d.dateTime).toISOString() : "", d.venue,
    Array.isArray(d.eligibleDepartments) ? d.eligibleDepartments.join(" | ") : "",
    d.minCgpa ?? "", d.minPercentage ?? "", countMap.get(String(d._id)) || 0,
    d.createdAt ? new Date(d.createdAt).toISOString() : ""
  ]));
  const csv = [headers.join(","), ...rows.map(r => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="drives_summary.csv"');
  return res.status(200).send(excelCsv(csv));
}

module.exports = {
  listDrives, createDrive, updateDrive, deleteDrive, registerForDrive, myDriveRegistrations,
  driveRegistrations, updateRegistrationStatus, downloadDriveReport, downloadDrivesSummaryReport
};
