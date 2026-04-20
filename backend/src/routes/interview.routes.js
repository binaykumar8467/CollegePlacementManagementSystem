const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/interview.controller");

router.post("/application/:applicationId", authRequired, requireRole("tpo"), ctrl.createInterview);
router.post("/drive-registration/:registrationId", authRequired, requireRole("tpo"), ctrl.createDriveInterview);
router.get("/my", authRequired, requireRole("student"), ctrl.listMyInterviews);
router.get("/job/:jobId", authRequired, requireRole("tpo"), ctrl.listJobInterviews);
router.get("/drive/:driveId", authRequired, requireRole("tpo"), ctrl.listDriveInterviews);

module.exports = router;
