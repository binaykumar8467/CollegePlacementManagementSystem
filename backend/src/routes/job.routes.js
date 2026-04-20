const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/job.controller");

router.get("/", ctrl.listJobs);
router.get("/report/download", authRequired, requireRole("tpo"), ctrl.downloadJobsReport);
router.get("/:jobId", ctrl.getJob);
router.post("/", authRequired, requireRole("tpo"), ctrl.createJob);
router.put("/:jobId", authRequired, requireRole("tpo"), ctrl.updateJob);
router.delete("/:jobId", authRequired, requireRole("tpo"), ctrl.deleteJob);

module.exports = router;
