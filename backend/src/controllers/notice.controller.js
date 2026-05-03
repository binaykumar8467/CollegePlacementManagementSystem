// Handles notice creation, updates, listing, and deletion for announcements.
const fs = require("fs");
const path = require("path");
const Notice = require("../models/Notice");
const { getCurrentPlacementYear, normalizePlacementYear } = require("../utils/placementYear");

// Convert the uploaded notice file into a storable attachment object.
function buildAttachment(file) {
  if (!file) return undefined;
  return {
    fileName: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/notices/${file.filename}`
  };
}

// Remove the old attachment file from disk when a notice is updated or deleted.
function deleteStoredFile(fileName) {
  if (!fileName) return;
  const filePath = path.join(process.cwd(), "uploads", "notices", fileName);
  fs.unlink(filePath, () => {});
}

// Add Excel-friendly formatting so notice reports open correctly.
function excelCsv(csvBody) {
  return "\ufeffsep=,\r\n" + String(csvBody).replace(/\r?\n/g, "\r\n");
}
// Escape commas, quotes, and line breaks before writing CSV values.
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Return notices in reverse creation order for portal display.
async function listNotices(req, res) {
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const query = placementYear ? { placementYear } : {};
  const notices = await Notice.find(query).sort({ createdAt: -1 }).lean();
  res.json(notices);
}

// Create a new notice with an optional attachment file.
async function createNotice(req, res) {
  const { title, content, placementYear } = req.body;
  const normalizedPlacementYear = normalizePlacementYear(placementYear) || getCurrentPlacementYear();
  if (!title || !content) return res.status(400).json({ message: "title and content required" });

  const notice = await Notice.create({
    title: String(title).trim(),
    content: String(content).trim(),
    attachment: buildAttachment(req.file),
    placementYear: normalizedPlacementYear,
    createdByTpo: req.user.id
  });

  res.status(201).json(notice);
}

// Update a notice and replace its attachment when needed.
async function updateNotice(req, res) {
  const { id } = req.params;
  const { title, content, placementYear } = req.body;

  const notice = await Notice.findById(id);
  if (!notice) return res.status(404).json({ message: "Notice not found" });
  if (String(notice.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "You can edit only your own notices" });
  if (!title || !content) return res.status(400).json({ message: "title and content required" });

  const removeAttachment = String(req.body.removeAttachment || "").toLowerCase() === "true";
  notice.title = String(title).trim();
  notice.content = String(content).trim();
  notice.placementYear = normalizePlacementYear(placementYear) || notice.placementYear || getCurrentPlacementYear();

  if (req.file) {
    deleteStoredFile(notice.attachment?.fileName);
    notice.attachment = buildAttachment(req.file);
  } else if (removeAttachment) {
    deleteStoredFile(notice.attachment?.fileName);
    notice.attachment = undefined;
  }

  await notice.save();
  res.json(notice);
}

// Delete a notice and remove its stored attachment file.
async function deleteNotice(req, res) {
  const { id } = req.params;
  const notice = await Notice.findById(id);
  if (!notice) return res.status(404).json({ message: "Notice not found" });
  if (String(notice.createdByTpo) !== String(req.user.id)) return res.status(403).json({ message: "You can delete only your own notices" });

  deleteStoredFile(notice.attachment?.fileName);
  await notice.deleteOne();
  res.json({ message: "Notice deleted" });
}

// Export the notice list as a CSV report.
async function downloadNoticesReport(req, res) {
  const placementYear = normalizePlacementYear(req.query.placementYear);
  const query = { createdByTpo: req.user.id, ...(placementYear ? { placementYear } : {}) };
  const notices = await Notice.find(query).sort({ createdAt: -1 }).lean();
  const headers = ["Title","Session","Preview","Attachment","CreatedAt","UpdatedAt"];
  const rows = notices.map((n) => ([
    n.title,
    n.placementYear || "",
    String(n.content || "").slice(0, 200),
    n.attachment?.originalName || "",
    n.createdAt ? new Date(n.createdAt).toISOString() : "",
    n.updatedAt ? new Date(n.updatedAt).toISOString() : ""
  ]));
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="notices_summary_${placementYear || "all"}.csv"`);
  return res.status(200).send(excelCsv(csv));
}

module.exports = { listNotices, createNotice, updateNotice, deleteNotice, downloadNoticesReport };
