const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.middleware");
const { uploadNoticeAttachment } = require("../middleware/upload.middleware");
const ctrl = require("../controllers/notice.controller");

router.get("/", ctrl.listNotices);
router.get("/report/download", authRequired, requireRole("tpo"), ctrl.downloadNoticesReport);
router.post("/", authRequired, requireRole("tpo"), uploadNoticeAttachment, ctrl.createNotice);
router.put("/:id", authRequired, requireRole("tpo"), uploadNoticeAttachment, ctrl.updateNotice);
router.delete("/:id", authRequired, requireRole("tpo"), ctrl.deleteNotice);

module.exports = router;
