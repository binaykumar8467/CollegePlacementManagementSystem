const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");

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

function excelCsv(csvBody) {
  return "\ufeffsep=,\r\n" + String(csvBody).replace(/\r?\n/g, "\r\n");
}
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

async function listJobs(req, res) {
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  res.json(jobs);
}

async function getJob(req, res) {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
}

async function createJob(req, res) {
  const { title, company, location, salary, description, eligibility, deadline } = req.body;
  if (!title || !company || !deadline) return res.status(400).json({ message: "title, company, deadline required" });

  const job = await Job.create({
    title, company,
    location: location || "",
    salary: salary || "",
    description: description || "",
    eligibility: eligibility || "",
    deadline: new Date(deadline),
    createdByTpo: req.user.id
  });
  res.status(201).json(job);
}

async function updateJob(req, res) {
  const { jobId } = req.params;
  const { title, company, location, salary, description, eligibility, deadline } = req.body;
  if (!title || !company || !deadline) return res.status(400).json({ message: "title, company, deadline required" });

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  await ensureJobOwnership(job, req.user.id);

  job.title = title;
  job.company = company;
  job.location = location || "";
  job.salary = salary || "";
  job.description = description || "";
  job.eligibility = eligibility || "";
  job.deadline = new Date(deadline);
  await job.save();

  res.json(job);
}

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
