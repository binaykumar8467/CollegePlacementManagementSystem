// Manages job CRUD operations and downloadable job summary reports.
const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const { parseEligibilityCourses } = require("../utils/studentEligibility");

// Make sure only the owning TPO can manage this job.
async function ensureJobOwnership(job, currentTpoId) {
  if (!job) return false;
  if (!job.createdByTpo || String(job.createdByTpo) === String(currentTpoId)) {
    return true;
  }

  // Allow the active TPO to adopt legacy job records that may still
  // point to an older TPO document after account updates.
  job.createdByTpo = currentTpoId;
  await job.save();
  return true;
}

// Add Excel-friendly formatting so exported CSV files open correctly.
function excelCsv(csvBody) {
  return "\ufeffsep=,\r\n" + String(csvBody).replace(/\r?\n/g, "\r\n");
}
// Escape commas, quotes, and line breaks before writing CSV values.
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Normalize selected eligibility courses before storing them in the job record.
function normalizeEligibilityCourses(value) {
  return [...new Set(parseEligibilityCourses(value))];
}

// Return the available job postings in reverse creation order.
async function listJobs(req, res) {
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  res.json(jobs);
}

// Return the full details of one job posting.
async function getJob(req, res) {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
}

// Create a new job posting for the logged-in TPO.
async function createJob(req, res) {
  const { title, company, location, salary, description, eligibilityCourses, deadline } = req.body;
  if (!title || !company || !deadline) return res.status(400).json({ message: "title, company, deadline required" });
  const normalizedEligibilityCourses = normalizeEligibilityCourses(eligibilityCourses);

  const job = await Job.create({
    title, company,
    location: location || "",
    salary: salary || "",
    description: description || "",
    eligibilityCourses: normalizedEligibilityCourses,
    eligibility: normalizedEligibilityCourses.join(", "),
    deadline: new Date(deadline),
    createdByTpo: req.user.id
  });
  res.status(201).json(job);
}

// Update an existing job posting after validating ownership.
async function updateJob(req, res) {
  const { jobId } = req.params;
  const { title, company, location, salary, description, eligibilityCourses, deadline } = req.body;
  if (!title || !company || !deadline) return res.status(400).json({ message: "title, company, deadline required" });
  const normalizedEligibilityCourses = normalizeEligibilityCourses(eligibilityCourses);

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await ensureJobOwnership(job, req.user.id);

  job.title = title;
  job.company = company;
  job.location = location || "";
  job.salary = salary || "";
  job.description = description || "";
  job.eligibilityCourses = normalizedEligibilityCourses;
  job.eligibility = normalizedEligibilityCourses.join(", ");
  job.deadline = new Date(deadline);
  await job.save();

  res.json(job);
}

// Delete a job and clean up its applications and interviews.
async function deleteJob(req, res) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await ensureJobOwnership(job, req.user.id);

  const applications = await Application.find({ job: jobId }).select("_id");
  const applicationIds = applications.map(x => x._id);
  if (applicationIds.length) await Interview.deleteMany({ application: { $in: applicationIds } });
  await Application.deleteMany({ job: jobId });
  await Job.findByIdAndDelete(jobId);
  res.json({ message: "Job deleted successfully" });
}

// Export the job summary for the logged-in TPO as a CSV report.
async function downloadJobsReport(req, res) {
  const jobs = await Job.find({ createdByTpo: req.user.id }).sort({ createdAt: -1 }).lean();
  const appCounts = await Application.aggregate([{ $group: { _id: "$job", total: { $sum: 1 } } }]);
  const countMap = new Map(appCounts.map((x) => [String(x._id), x.total]));
  const headers = ["Title","Company","Location","Salary","Deadline","Applicants","CreatedAt"];
  const rows = jobs.map((j) => ([j.title, j.company, j.location, j.salary, j.deadline ? new Date(j.deadline).toISOString() : "", countMap.get(String(j._id)) || 0, j.createdAt ? new Date(j.createdAt).toISOString() : ""]));
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="jobs_summary.csv"');
  return res.status(200).send(excelCsv(csv));
}

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, downloadJobsReport };
