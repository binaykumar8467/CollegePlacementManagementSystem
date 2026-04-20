const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/placement.controller");

router.get("/", ctrl.listPlacements);
router.post("/application/:applicationId", authRequired, requireRole("tpo"), ctrl.markSelectedToPlacement);
router.delete("/:placementId", authRequired, requireRole("tpo"), ctrl.deletePlacement);
router.get("/report/download", authRequired, requireRole("tpo"), ctrl.downloadPlacementsReport);

module.exports = router;
