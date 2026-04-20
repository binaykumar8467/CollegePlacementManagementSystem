const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const asyncHandler = require("../utils/asyncHandler");

router.post("/student/signup", asyncHandler(ctrl.studentSignup));
router.post("/student/login", asyncHandler(ctrl.studentLogin));
router.post("/student/forgot-password", asyncHandler(ctrl.studentForgotPassword));
router.post("/student/forgot-password/verify-otp", asyncHandler(ctrl.verifyStudentForgotPasswordOtp));
router.post("/student/forgot-password/reset", asyncHandler(ctrl.resetStudentPasswordWithOtp));

router.post("/tpo/signup", asyncHandler(ctrl.tpoSignup));
router.post("/tpo/login", asyncHandler(ctrl.tpoLogin));

module.exports = router;
