// Declares API routes for placement drives and drive registrations.
const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/drive.controller");

router.get("/", ctrl.listDrives);
router.get("/report/download", authRequired, requireRole("tpo"), ctrl.downloadDrivesSummaryReport);
router.get("/my/registrations", authRequired, requireRole("student"), ctrl.myDriveRegistrations);

router.post("/", authRequired, requireRole("tpo"), ctrl.createDrive);
router.put("/:driveId", authRequired, requireRole("tpo"), ctrl.updateDrive);
router.delete("/:driveId", authRequired, requireRole("tpo"), ctrl.deleteDrive);
router.get("/:driveId/registrations", authRequired, requireRole("tpo"), ctrl.driveRegistrations);
router.patch("/registration/:regId/status", authRequired, requireRole("tpo"), ctrl.updateRegistrationStatus);
router.get("/:driveId/report", authRequired, requireRole("tpo"), ctrl.downloadDriveReport);

router.post("/:driveId/register", authRequired, requireRole("student"), ctrl.registerForDrive);

module.exports = router;
