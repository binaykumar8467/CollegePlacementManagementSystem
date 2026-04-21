const Student = require("../models/Student");
const Application = require("../models/Application");
const DriveRegistration = require("../models/DriveRegistration");
const { ensureUniqueIdentity, normalizePhone } = require("../utils/identity");
const { normalizePlacementYear } = require("../utils/placementYear");

function sanitize(st) {
  const o = st.toObject();
  delete o.password;
  delete o.resumeData;
  delete o.profilePhotoData;
  o.placementYear = normalizePlacementYear(o.placementYear);
  return o;
}

function normalizeSemesterValues(semesterPercentages) {
  const values = Array.isArray(semesterPercentages)
    ? semesterPercentages.slice(0, 8).map((x) => (typeof x === "string" ? x.trim() : x))
    : [];

  let lastFilledIndex = -1;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value !== "" && value !== null && typeof value !== "undefined") {
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) lastFilledIndex = i;
    }
  }
  if (lastFilledIndex === -1) {
    for (let i = 0; i < values.length; i += 1) {
      const value = values[i];
      if (value !== "" && value !== null && typeof value !== "undefined") {
        const num = Number(value);
        if (Number.isFinite(num)) lastFilledIndex = i;
      }
    }
  }

  return values
    .slice(0, lastFilledIndex + 1)
    .filter((x) => x !== "" && x !== null && typeof x !== "undefined")
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));
}

function calculateOverallPercentage(semesterPercentages) {
  const values = normalizeSemesterValues(semesterPercentages);
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function excelCsv(csvBody) {
  return "\ufeffsep=,\r\n" + String(csvBody).replace(/\r?\n/g, "\r\n");
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

function setStringOrUnset(doc, field, value) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  doc[field] = trimmed || undefined;
}

function setNumberOrUnset(doc, field, value) {
  if (value === "" || value === null || typeof value === "undefined") {
    doc[field] = undefined;
    return true;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  doc[field] = num;
  return true;
}

async function listStudents(req, res) {
  const requestedPlacementYear = normalizePlacementYear(req.query.placementYear);
  const students = await Student.find()
    .select("-password -resumeData -profilePhotoData")
    .sort({ createdAt: -1 })
    .lean();
  const filtered = requestedPlacementYear
    ? students.filter((student) => normalizePlacementYear(student.placementYear) === requestedPlacementYear)
    : students;
  res.json(filtered);
}

async function downloadStudentsReport(req, res) {
  const requestedPlacementYear = normalizePlacementYear(req.query.placementYear);
  const students = await Student.find()
    .select("-password -resumeData -profilePhotoData")
    .sort({ createdAt: -1 })
    .lean();
  const filteredStudents = requestedPlacementYear
    ? students.filter((student) => normalizePlacementYear(student.placementYear) === requestedPlacementYear)
    : students;

  const headers = ["Name","Email","Phone","RollNo","Department","Year","Session","Approved","CGPA","Percentage","Class10Percentage","Class12Percentage","ResumeUploaded","PhotoUploaded","CreatedAt"];
  const rows = filteredStudents.map((s) => ([
    s.name, s.email, excelText(s.phone), excelText(s.rollNo), s.department, s.year, normalizePlacementYear(s.placementYear),
    s.isApproved ? "YES" : "NO", s.cgpa ?? "", s.percentage ?? "", s.class10Percentage ?? "", s.class12Percentage ?? "",
    s.resumeFile ? "YES" : "NO", s.profilePhotoFile ? "YES" : "NO",
    s.createdAt ? new Date(s.createdAt).toISOString() : ""
  ]));
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="students_${requestedPlacementYear || 'all'}.csv"`);
  return res.status(200).send(excelCsv(csv));
}

async function setApproval(req, res) {
  const { studentId } = req.params;
  const { isApproved, approvalNote } = req.body;

  const st = await Student.findById(studentId);
  if (!st) return res.status(404).json({ message: "Student not found" });

  st.isApproved = Boolean(isApproved);
  st.approvalNote = approvalNote ? String(approvalNote).trim() : undefined;
  await st.save();

  res.json(sanitize(st));
}

async function updateMyProfile(req, res) {
  const { rollNo, department, year, phone, skills, resumeLink, semesterPercentages, cgpa, gradingSystem, class10Percentage, class12Percentage } = req.body;

  const st = await Student.findById(req.user.id);
  if (!st) return res.status(404).json({ message: "Student not found" });

  if (typeof phone === "string" && normalizePhone(phone) !== normalizePhone(st.phone)) {
    await ensureUniqueIdentity({ phone, excludeStudentId: st._id });
  }

  if (typeof rollNo === "string") {
    const normalizedRollNo = rollNo.trim();
    if (normalizedRollNo && !/^\d+$/.test(normalizedRollNo)) {
      return res.status(400).json({ message: "Roll number must contain digits only" });
    }
  }

  setStringOrUnset(st, "rollNo", rollNo);
  setStringOrUnset(st, "department", department);
  setStringOrUnset(st, "year", year);
  if (typeof phone === "string") st.phone = normalizePhone(phone) || undefined;
  if (Array.isArray(skills)) st.skills = skills.length ? skills : undefined;
  setStringOrUnset(st, "resumeLink", resumeLink);

  if (!setNumberOrUnset(st, "class10Percentage", class10Percentage)) {
    return res.status(400).json({ message: "Class 10 percentage must be 0-100" });
  }
  if (typeof st.class10Percentage !== "undefined" && (st.class10Percentage < 0 || st.class10Percentage > 100)) {
    return res.status(400).json({ message: "Class 10 percentage must be 0-100" });
  }

  if (!setNumberOrUnset(st, "class12Percentage", class12Percentage)) {
    return res.status(400).json({ message: "Class 12 percentage must be 0-100" });
  }
  if (typeof st.class12Percentage !== "undefined" && (st.class12Percentage < 0 || st.class12Percentage > 100)) {
    return res.status(400).json({ message: "Class 12 percentage must be 0-100" });
  }

  const normalizedGradingSystem = gradingSystem === "cgpa" || gradingSystem === "percentage" ? gradingSystem : "";
  st.gradingSystem = normalizedGradingSystem || undefined;

  if (normalizedGradingSystem === "cgpa") {
    const n = Number(cgpa);
    if (!Number.isFinite(n) || n < 0 || n > 10) return res.status(400).json({ message: "CGPA must be between 0 and 10" });
    st.cgpa = n;
    st.semesterPercentages = undefined;
    st.percentage = undefined;
  } else if (normalizedGradingSystem === "percentage") {
    if (!Array.isArray(semesterPercentages) || !semesterPercentages.length) {
      return res.status(400).json({ message: "Enter semester percentages for percentage based courses" });
    }
    const cleaned = normalizeSemesterValues(semesterPercentages);
    if (!cleaned.length) return res.status(400).json({ message: "Enter valid semester percentages" });
    for (const v of cleaned) {
      if (v < 0 || v > 100) return res.status(400).json({ message: "Semester percentage must be 0-100" });
    }
    st.semesterPercentages = cleaned;
    st.percentage = calculateOverallPercentage(cleaned);
    st.cgpa = undefined;
  } else {
    st.cgpa = undefined;
    st.percentage = undefined;
    st.semesterPercentages = undefined;
  }

  await st.save();
  res.json(sanitize(st));
}

async function uploadMyResume(req, res) {
  const st = await Student.findById(req.user.id);
  if (!st) return res.status(404).json({ message: "Student not found" });
  if (!req.file) return res.status(400).json({ message: "Resume PDF required" });

  st.resumeFile = `/api/students/${st._id}/resume`;
  st.resumeFileName = req.file.originalname || "resume.pdf";
  st.resumeMimeType = req.file.mimetype || "application/pdf";
  st.resumeData = req.file.buffer;
  await st.save();
  res.json(sanitize(st));
}

async function uploadMyPhoto(req, res) {
  const st = await Student.findById(req.user.id);
  if (!st) return res.status(404).json({ message: "Student not found" });
  if (!req.file) return res.status(400).json({ message: "Photo file required" });

  st.profilePhotoFile = `/api/students/${st._id}/photo`;
  st.profilePhotoFileName = req.file.originalname || "photo.jpg";
  st.profilePhotoMimeType = req.file.mimetype || "image/jpeg";
  st.profilePhotoData = req.file.buffer;
  await st.save();
  res.json(sanitize(st));
}

async function viewResume(req, res) {
  const { studentId } = req.params;
  const st = await Student.findById(studentId).select("resumeData resumeMimeType resumeFileName name");
  if (!st || !st.resumeData) return res.status(404).json({ message: "Resume not found" });

  res.setHeader("Content-Type", st.resumeMimeType || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${String(st.resumeFileName || `${st.name || 'resume'}.pdf`).replace(/"/g, "")}"`);
  return res.send(st.resumeData);
}

async function viewPhoto(req, res) {
  const { studentId } = req.params;
  const st = await Student.findById(studentId).select("profilePhotoData profilePhotoMimeType profilePhotoFileName name");
  if (!st || !st.profilePhotoData) return res.status(404).json({ message: "Photo not found" });

  const fileName = String(st.profilePhotoFileName || `${st.name || 'student'}-photo`).replace(/"/g, "");
  res.setHeader("Content-Type", st.profilePhotoMimeType || "image/jpeg");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  return res.send(st.profilePhotoData);
}

async function deleteStudent(req, res) {
  const { studentId } = req.params;
  const deleted = await Student.findByIdAndDelete(studentId);
  if (!deleted) return res.status(404).json({ message: "Student not found" });
  await Application.deleteMany({ student: studentId });
  await DriveRegistration.deleteMany({ student: studentId });
  res.json({ message: "Student removed successfully" });
}

module.exports = {
  listStudents,
  downloadStudentsReport,
  setApproval,
  updateMyProfile,
  uploadMyResume,
  uploadMyPhoto,
  viewResume,
  viewPhoto,
  deleteStudent
};
