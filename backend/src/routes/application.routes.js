const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/application.controller");

router.post("/:jobId/apply", authRequired, requireRole("student"), ctrl.applyToJob);
router.get("/my", authRequired, requireRole("student"), ctrl.myApplications);

router.get("/job/:jobId", authRequired, requireRole("tpo"), ctrl.applicationsForJob);
router.get("/job/:jobId/report", authRequired, requireRole("tpo"), ctrl.downloadApplicantsReport);
router.patch("/:applicationId/status", authRequired, requireRole("tpo"), ctrl.updateApplicationStatus);

module.exports = router;
