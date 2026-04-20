const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/student.controller");
const { uploadResume, uploadProfilePhoto } = require("../middleware/upload.middleware");

router.get("/", authRequired, requireRole("tpo"), ctrl.listStudents);
router.get("/report/download", authRequired, requireRole("tpo"), ctrl.downloadStudentsReport);
router.get("/:studentId/resume", authRequired, ctrl.viewResume);
router.get("/:studentId/photo", authRequired, ctrl.viewPhoto);
router.patch("/:studentId/approval", authRequired, requireRole("tpo"), ctrl.setApproval);
router.delete("/:studentId", authRequired, requireRole("tpo"), ctrl.deleteStudent);

router.patch("/me/profile", authRequired, requireRole("student"), ctrl.updateMyProfile);
router.post("/me/resume", authRequired, requireRole("student"), uploadResume, ctrl.uploadMyResume);
router.post("/me/photo", authRequired, requireRole("student"), uploadProfilePhoto, ctrl.uploadMyPhoto);

module.exports = router;
