const multer = require("multer");
const fs = require("fs");
const path = require("path");

const memoryStorage = multer.memoryStorage();

function resumeFileFilter(req, file, cb) {
  const isPdf = file.mimetype === "application/pdf" || String(file.originalname || "").toLowerCase().endsWith(".pdf");
  if (!isPdf) return cb(new Error("Only PDF files are allowed"), false);
  cb(null, true);
}

function profilePhotoFilter(req, file, cb) {
  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
  const lowerName = String(file.originalname || "").toLowerCase();
  const extAllowed = [".jpg", ".jpeg", ".png", ".webp"].some((ext) => lowerName.endsWith(ext));
  if (!allowed.has(file.mimetype) && !extAllowed) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
  }
  cb(null, true);
}

const uploadResume = multer({
  storage: memoryStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("resume");

const uploadProfilePhoto = multer({
  storage: memoryStorage,
  fileFilter: profilePhotoFilter,
  limits: { fileSize: 3 * 1024 * 1024 }
}).single("photo");

const noticeUploadDir = path.join(process.cwd(), "uploads", "notices");
fs.mkdirSync(noticeUploadDir, { recursive: true });

const noticeStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, noticeUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "") || "";
    const base = path
      .basename(file.originalname || "attachment", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "attachment";
    cb(null, `${Date.now()}-${base}${ext.toLowerCase()}`);
  }
});

function noticeFileFilter(req, file, cb) {
  const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]);
  const lowerName = String(file.originalname || "").toLowerCase();
  const allowedExt = [".pdf", ".doc", ".docx"].some((ext) => lowerName.endsWith(ext));

  if (!allowedMimeTypes.has(file.mimetype) && !allowedExt) {
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
  }

  cb(null, true);
}

const uploadNoticeAttachment = multer({
  storage: noticeStorage,
  fileFilter: noticeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single("attachment");

module.exports = { uploadResume, uploadNoticeAttachment, uploadProfilePhoto };
